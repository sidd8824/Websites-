import { useEffect, useRef } from 'react';

// One fixed canvas behind the whole site. It does three jobs:
//  1. ONE COLOUR FAMILY: the whole page lives in a single indigo-violet hue (the same family as
//     the Projects cloth). Nothing ever "switches". Instead the SHADE drifts continuously as
//     you scroll: each section has its own shade, and the background eases from one to the
//     next across the whole distance between the two sections' centres. The steps between
//     neighbouring shades are small, so even a fast scroll never feels like a sudden change.
//  2. SOFT LIGHT: two large, slow, low-contrast light pools of the same hue drift behind everything.
//  3. PIXEL-GRID TRAIL: a faint grid; wherever the mouse passes over empty space the cells
//     glow in a soft tint of the same hue and fade away.
// It also publishes --mx / --my on <html> (cursor position).

type Shade = { id: string; bg: string };

export const BASE_BG = '#07060F'; // hero / home: the darkest point

// Shades of ONE hue (indigo-violet), light to dark. Order = order on the page.
// All keep white text at 8:1 or better.
export const SHADES: Shade[] = [
  { id: 'about', bg: '#3A3188' },
  { id: 'verticals', bg: '#1C1648' },
  { id: 'projects', bg: '#1C1648' }, // covered by its own cloth panel; listed so the drift is seamless
  { id: 'events', bg: '#463C9A' },
  { id: 'team', bg: '#2E2576' },
  { id: 'join', bg: '#130F38' },
];

// Cursor-trail tints (same family, so the trail never clashes with the background)
const ACCENTS = ['#9D8FE6', '#7FB4E0', '#C79BD6'];

const CELL = 48;
const FOLLOW = 0.1; // how quickly the drawn colour eases toward the scroll target (0..1 per frame)

const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const rgbOf = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const BASE_RGB = rgbOf(BASE_BG);

export default function SectionStage() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const root = document.documentElement;

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // section elements (looked up lazily: they mount after this component)
    const els: (HTMLElement | null)[] = SHADES.map(() => null);
    let homeEl: HTMLElement | null = null;
    const lookup = () => {
      SHADES.forEach((s, i) => { if (!els[i]) els[i] = document.getElementById(s.id); });
      if (!homeEl) homeEl = document.getElementById('home');
    };

    // ---- mouse trail ----
    type Cell = { a: number; color: string };
    const cells = new Map<string, Cell>();
    let lastX = -1;
    let lastY = -1;
    let tick = 0;

    const light = (cx: number, cy: number, accents: string[], strength = 1) => {
      const key = `${cx},${cy}`;
      const prev = cells.get(key);
      if (prev && prev.a > strength) return;
      cells.set(key, { a: strength, color: accents[tick++ % accents.length] });
    };

    const onMove = (e: MouseEvent) => {
      root.style.setProperty('--mx', `${e.clientX}px`);
      root.style.setProperty('--my', `${e.clientY}px`);
      if (reduce || touch) return;
      if (lastX < 0) { lastX = e.clientX; lastY = e.clientY; }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (CELL * 0.5)));
      const accents = ACCENTS;
      for (let i = 1; i <= steps; i++) {
        const x = lastX + (dx * i) / steps;
        const y = lastY + (dy * i) / steps;
        const cx = Math.floor(x / CELL);
        const cy = Math.floor(y / CELL);
        light(cx, cy, accents, 1);
        if (Math.random() < 0.35) light(cx + (Math.random() < 0.5 ? -1 : 1), cy, accents, 0.7);
        if (Math.random() < 0.35) light(cx, cy + (Math.random() < 0.5 ? -1 : 1), accents, 0.7);
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // ---- draw loop ----
    const cur: [number, number, number] = [...BASE_RGB];
    const start = performance.now();
    let raf = 0;
    let settled = false;

    const frame = (now: number) => {
      const t = reduce ? 0 : (now - start) / 1000;
      lookup();
      const sy = window.scrollY;

      // Anchor points down the page: [document-y, colour]. The hero stays darkest until ~45% through it, then eases toward About.
      const anchors: { y: number; c: [number, number, number] }[] = [];
      if (homeEl) {
        const hr = homeEl.getBoundingClientRect();
        anchors.push({ y: hr.top + sy + hr.height * 0.45, c: BASE_RGB });
      } else {
        anchors.push({ y: 0, c: BASE_RGB });
      }
      for (let i = 0; i < SHADES.length; i++) {
        const el = els[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        anchors.push({ y: r.top + sy + r.height * 0.5, c: rgbOf(SHADES[i].bg) });
      }
      anchors.sort((a, b) => a.y - b.y);

      // where on the page are we looking? a little below the middle of the screen
      const py = sy + h * 0.55;
      let target = anchors[anchors.length - 1].c;
      if (py <= anchors[0].y) target = anchors[0].c;
      else {
        for (let i = 0; i < anchors.length - 1; i++) {
          const a0 = anchors[i];
          const a1 = anchors[i + 1];
          if (py >= a0.y && py <= a1.y) {
            const u = ease(clamp01((py - a0.y) / Math.max(1, a1.y - a0.y)));
            target = [0, 1, 2].map((k) => a0.c[k] + (a1.c[k] - a0.c[k]) * u) as [number, number, number];
            break;
          }
        }
      }

      let moving = false;
      for (let k = 0; k < 3; k++) {
        const d = target[k] - cur[k];
        if (reduce || Math.abs(d) < 0.3) cur[k] = target[k];
        else { cur[k] += d * FOLLOW; moving = true; }
      }
      settled = !moving;

      ctx.fillStyle = `rgb(${cur[0] | 0},${cur[1] | 0},${cur[2] | 0})`;
      ctx.fillRect(0, 0, w, h);

      // two big, slow light pools in a lighter tint of the same shade (very low contrast)
      const lift = (f: number) => `${Math.min(255, cur[0] + (255 - cur[0]) * f) | 0},${Math.min(255, cur[1] + (255 - cur[1]) * f) | 0},${Math.min(255, cur[2] + (255 - cur[2]) * f) | 0}`;
      const R = Math.max(w, h) * 0.75;
      const pools = [
        { x: w * (0.78 + 0.08 * Math.sin(t * 0.13)), y: h * (0.2 + 0.08 * Math.cos(t * 0.11)), f: 0.2, a: 0.2 },
        { x: w * (0.2 + 0.08 * Math.cos(t * 0.1)), y: h * (0.85 + 0.06 * Math.sin(t * 0.14)), f: 0.12, a: 0.16 },
      ];
      for (const pl of pools) {
        const g = ctx.createRadialGradient(pl.x, pl.y, 0, pl.x, pl.y, R);
        g.addColorStop(0, `rgba(${lift(pl.f)},${pl.a})`);
        g.addColorStop(1, `rgba(${lift(pl.f)},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // faint grid
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += CELL) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
      for (let y = 0; y <= h; y += CELL) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
      ctx.stroke();

      // glowing grid cells under the cursor trail
      cells.forEach((c, key) => {
        c.a -= 0.022;
        if (c.a <= 0) { cells.delete(key); return; }
        const [cx, cy] = key.split(',').map(Number);
        ctx.globalAlpha = Math.min(1, c.a) * 0.3;
        ctx.fillStyle = c.color;
        ctx.fillRect(cx * CELL + 2, cy * CELL + 2, CELL - 4, CELL - 4);
      });
      ctx.globalAlpha = 1;

      if (!reduce || cells.size || !settled) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // reduced motion: there is no continuous loop, so repaint when the page scrolls
    const onScroll = () => { if (reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}
