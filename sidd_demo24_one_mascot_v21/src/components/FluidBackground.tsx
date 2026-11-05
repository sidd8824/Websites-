import { useEffect, useRef } from 'react';

// Dark, colourful, mouse-reactive backdrop for the whole site (replaces the star field).
//  - Big soft colour blobs drift slowly behind everything.
//  - The palette crossfades as you scroll from one section to the next.
//  - Wherever the mouse moves, it leaves a trail of glowing colour that melts away.
// It lives on a fixed canvas BEHIND the page, so the trail shows wherever no
// opaque element covers it. (Coloured panels get their own cursor glow via --mx/--my.)

type RGB = [number, number, number];
export type Palette = { base: RGB; blobs: RGB[] };

const h = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Per-section palettes. The canvas sits behind every section, and the
// canvas still tracks them so the transition in/out stays seamless.
export const SECTION_PALETTES: Record<string, Palette> = {
  home:      { base: h('#05040C'), blobs: [h('#7C3AED'), h('#DB2777'), h('#06B6D4'), h('#4F46E5')] },
  about:     { base: h('#0A0507'), blobs: [h('#F97316'), h('#E11D48'), h('#A21CAF'), h('#FBBF24')] },
  verticals: { base: h('#040716'), blobs: [h('#2563EB'), h('#06B6D4'), h('#7C3AED'), h('#0EA5E9')] },
  projects:  { base: h('#03100C'), blobs: [h('#10B981'), h('#84CC16'), h('#06B6D4'), h('#059669')] },
  events:    { base: h('#120505'), blobs: [h('#EF4444'), h('#F97316'), h('#FBBF24'), h('#DB2777')] },
  team:      { base: h('#0D0414'), blobs: [h('#D946EF'), h('#8B5CF6'), h('#F472B6'), h('#6366F1')] },
  join:      { base: h('#04070F'), blobs: [h('#22D3EE'), h('#8B5CF6'), h('#3B82F6'), h('#EC4899')] },
};


export default function FluidBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const SCALE = 0.5; // render at half-res; the CSS blur hides it
    let w = 0;
    let hgt = 0;
    let raf = 0;

    const resize = () => {
      w = Math.max(1, Math.round(window.innerWidth * SCALE));
      hgt = Math.max(1, Math.round(window.innerHeight * SCALE));
      canvas.width = w;
      canvas.height = hgt;
    };
    resize();
    window.addEventListener('resize', resize);

    // Current (smoothed) palette
    const cur: Palette = {
      base: [...SECTION_PALETTES.home.base] as RGB,
      blobs: SECTION_PALETTES.home.blobs.map((c) => [...c] as RGB),
    };

    // Mouse trail
    type Drop = { x: number; y: number; r: number; life: number; max: number; c: number };
    const drops: Drop[] = [];
    let mx = -1000;
    let my = -1000;
    let lastX = -1000;
    let lastY = -1000;
    let colorTick = 0;
    const root = document.documentElement;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      root.style.setProperty('--mx', `${mx}px`);
      root.style.setProperty('--my', `${my}px`);
      if (reduce || touch) return;
      if (lastX < -500) { lastX = mx; lastY = my; }
      const dx = mx - lastX;
      const dy = my - lastY;
      const dist = Math.hypot(dx, dy);
      const step = 22;
      const n = Math.floor(dist / step);
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        drops.push({
          x: (lastX + dx * t) * SCALE,
          y: (lastY + dy * t) * SCALE,
          r: (70 + Math.min(dist, 120) * 0.7) * SCALE,
          life: 0,
          max: 70 + Math.random() * 40,
          c: colorTick++ % 4,
        });
      }
      if (n > 0) { lastX = mx; lastY = my; }
      if (drops.length > 140) drops.splice(0, drops.length - 140);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const start = performance.now();
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgb(${cur.base[0] | 0},${cur.base[1] | 0},${cur.base[2] | 0})`;
      ctx.fillRect(0, 0, w, hgt);

      // Ambient drifting blobs (kept dim so the site stays dark)
      ctx.globalCompositeOperation = 'lighter';
      const R = Math.max(w, hgt);
      cur.blobs.forEach((c, i) => {
        const sp = reduce ? 0 : 0.11 + i * 0.035;
        const px = w * (0.5 + 0.42 * Math.sin(t * sp + i * 1.9));
        const py = hgt * (0.5 + 0.38 * Math.cos(t * sp * 0.8 + i * 2.7));
        const r = R * (0.5 + 0.08 * Math.sin(t * 0.3 + i));
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0.30)`);
        g.addColorStop(1, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, hgt);
      });

      // Mouse trail
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.life++;
        if (d.life >= d.max) { drops.splice(i, 1); continue; }
        const p = d.life / d.max;
        const a = (1 - p) * (1 - p) * 0.6;
        const c = cur.blobs[d.c];
        // brighten trail colours so they pop over the dark base
        const r0 = Math.min(255, c[0] * 1.25 + 30) | 0;
        const g0 = Math.min(255, c[1] * 1.25 + 30) | 0;
        const b0 = Math.min(255, c[2] * 1.25 + 30) | 0;
        const rad = d.r * (0.6 + p * 0.9);
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, rad);
        g.addColorStop(0, `rgba(${r0},${g0},${b0},${a})`);
        g.addColorStop(1, `rgba(${r0},${g0},${b0},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(d.x - rad, d.y - rad, rad * 2, rad * 2);
      }

      // Soft cursor halo
      if (mx > -500 && !reduce && !touch) {
        const c = cur.blobs[0];
        const rad = 150 * SCALE;
        const g = ctx.createRadialGradient(mx * SCALE, my * SCALE, 0, mx * SCALE, my * SCALE, rad);
        g.addColorStop(0, `rgba(${Math.min(255, c[0] + 60) | 0},${Math.min(255, c[1] + 60) | 0},${Math.min(255, c[2] + 60) | 0},0.35)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(mx * SCALE - rad, my * SCALE - rad, rad * 2, rad * 2);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ filter: 'blur(28px) saturate(1.35)', transform: 'scale(1.1)' }}
    />
  );
}
