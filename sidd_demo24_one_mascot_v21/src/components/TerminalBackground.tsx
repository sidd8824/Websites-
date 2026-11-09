import { useEffect, useRef } from 'react';

// Scrolling terminal text behind the whole site (ported from the "B/Stack Terminal Background" demo).
//  - rows of fake prompts and boot logs drift upward, with a blinking block cursor on the last row
//  - random characters glitch in and fade out
//  - the pointer "heats" nearby characters; a click tears a horizontal band open
// It draws on a transparent canvas, so the colour-drifting backdrop (SectionStage) shows through.
// Everything lives in CFG below: change the colours, text and speeds there.

const CFG = {
  color: '#33ff77', // terminal text colour
  hot: '#ffffff', // colour of freshly "heated" characters
  size: 15, // font size in px
  baseAlpha: 0.1, // opacity of log lines
  promptAlpha: 0.2, // opacity of prompt lines
  maxAlpha: 0.55, // ceiling for heated characters, so page text never fights a bright glyph
  glitch: 0.0006, // share of cells that flicker each frame
  radius: 100, // pointer influence in px
  scrollMs: 1600, // time per row of upward drift
  user: 'guest@bstack:~$ ',
  commands: [
    'git commit -m "ship it"',
    'npm run build',
    'ssh bstack@clubroom',
    'python train.py --epochs 50',
    'sudo make coffee',
    'ls -la /projects',
    'docker compose up',
    'cat manifesto.txt',
    './deploy.sh --prod',
    'ping hackathon.local',
  ],
  logs: [
    '[ OK ] Started web vertical',
    '[ OK ] Loaded ai module',
    '[ OK ] Mounted /clubroom',
    '[WARN] coffee level low',
    '[ OK ] Connected to Bosscoder network',
    'Compiling 128 modules...',
    'Build succeeded in 2.4s',
    '0 errors, 0 warnings',
    'Listening on port 3000',
    'Fetching packages... done',
  ],
};

const FONT = 'ui-monospace, Menlo, Consolas, monospace';
const GLYPHS = '01ABCDEF<>/{}[];:=+-*#$%&';

type Row = { chars: string[]; heat: number[]; prompt: boolean };

const pick = <T,>(a: T[]): T => a[(Math.random() * a.length) | 0];
const randomGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

export default function TerminalBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let cw = 8;
    let rowH = CFG.size * 2.6;
    let grid: Row[] = [];
    let mx = -999;
    let my = -999;
    let lastScroll = 0;
    let raf = 0;

    const makeRow = (): Row => {
      const prompt = Math.random() < 0.3;
      const text = prompt ? CFG.user + pick(CFG.commands) : Math.random() < 0.5 ? '' : pick(CFG.logs);
      const chars: string[] = [];
      const heat: number[] = [];
      for (let c = 0; c < cols; c++) {
        chars.push(text[c] || ' ');
        heat.push(0);
      }
      return { chars, heat, prompt };
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const off = reduce ? 0 : Math.min((t - lastScroll) / CFG.scrollMs, 1) * rowH;

      if (!reduce) {
        for (let i = 0; i < rows * cols * CFG.glitch; i++) {
          const r = grid[(Math.random() * rows) | 0];
          const c = (Math.random() * cols) | 0;
          r.heat[c] = 1;
          r.chars[c] = randomGlyph();
        }
      }

      for (let r = 0; r < rows; r++) {
        const row = grid[r];
        const y = r * rowH - off;
        const base = row.prompt ? CFG.promptAlpha : CFG.baseAlpha;
        for (let c = 0; c < cols; c++) {
          const x = c * cw;
          const ch = row.chars[c];
          if (!reduce) {
            const d = Math.hypot(x - mx, y - my);
            if (d < CFG.radius && Math.random() < 0.05) {
              row.heat[c] = Math.max(row.heat[c], 1 - d / CFG.radius);
              row.chars[c] = randomGlyph();
            }
          }
          let h = (row.heat[c] *= 0.93);
          if (h < 0.02) row.heat[c] = h = 0;
          if (ch === ' ' && h === 0) continue;
          ctx.globalAlpha = Math.min(base + h * 0.85, CFG.maxAlpha);
          ctx.fillStyle = h > 0.6 ? CFG.hot : CFG.color;
          ctx.fillText(ch, x, y);
        }
      }

      // blinking block cursor on the last row (steady when motion is reduced)
      if (reduce || ((t / 500) | 0) % 2 === 0) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = CFG.color;
        ctx.fillRect(0, (rows - 1) * rowH - off, cw, CFG.size * 1.1);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      if (t - lastScroll > CFG.scrollMs) {
        lastScroll = t;
        grid.shift();
        grid.push(makeRow());
      }
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${CFG.size}px ${FONT}`;
      ctx.textBaseline = 'top';
      cw = ctx.measureText('M').width;
      rowH = CFG.size * 2.6;
      cols = Math.ceil(W / cw) + 1;
      rows = Math.ceil(H / rowH) + 1;
      grid = Array.from({ length: rows }, makeRow);
      if (reduce) draw(0);
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    // click = horizontal tear
    const onDown = (e: PointerEvent) => {
      if (reduce) return;
      const c0 = (e.clientX / cw) | 0;
      const r0 = (e.clientY / rowH) | 0;
      for (let dr = -2; dr <= 2; dr++) {
        const row = grid[r0 + dr];
        if (!row) continue;
        for (let c = 0; c < cols; c++) {
          const f = 1 - Math.abs(c - c0) / (cols * 0.5) - Math.abs(dr) * 0.25;
          if (f > 0 && Math.random() < f + 0.3) {
            row.heat[c] = Math.max(row.heat[c], f);
            row.chars[c] = randomGlyph();
          }
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="absolute inset-0 w-full h-full" aria-hidden="true" />
      {/* CRT scanlines */}
      <div
        className="absolute inset-0"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0 1px, transparent 1px 3px)' }}
      />
    </>
  );
}
