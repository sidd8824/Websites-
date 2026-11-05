import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Transition between Verticals and Projects.
//
// Scroll-driven (scrubs both ways):
//   1. Three BIG boxes fill the screen: BUILD. / SHIP IT. / BREAK. FIX. REPEAT. The side boxes
//      are cropped by the screen edges, the middle one is nearly full-screen.
//   2. The middle box swells until it covers the whole screen; the side boxes slide away.
//   3. Letters of PROJECTS fly in from all around, spinning and blurred, and settle into a
//      hand-made, slightly crooked word (marker font, some letters filled, some outlined).
//   4. Hand-drawn doodles (underline, circle, arrow + note, stars, zig-zag) draw themselves
//      around the word and stay there.
//   5. Word + doodles lift away and the violet dissolves into the real Projects section.

const WORD = 'PROJECTS'.split('');
// How much scrolling the PROJECTS intro takes (was 380). Lower = quicker, higher = slower.
const SCENE_VH = 260;
const MARKER = { fontFamily: "'Permanent Marker', 'Bricolage Grotesque', cursive" } as const;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const rnd = (n: number) => {
  const v = Math.sin(n * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};
const SCATTER = WORD.map((_, i) => ({
  x: (rnd(i + 1) - 0.5) * 2,
  y: (rnd(i + 11) - 0.5) * 2,
  rot: (rnd(i + 21) - 0.5) * 720,
  scale: 0.3 + rnd(i + 31) * 2.2,
}));
// final hand-made wonkiness (rotation in deg, vertical nudge in em)
const TILT = [-5, 3, -2, 5, -4, 2, -5, 4];
const NUDGE = [0.0, -0.04, 0.03, -0.03, 0.04, -0.02, 0.03, -0.04];
// letter look: fill colour, or outline only
const LOOK: { fill: string | null; stroke?: string }[] = [
  { fill: '#F4EEFF' },
  { fill: null, stroke: '#F4EEFF' },
  { fill: '#FF9B7A' },
  { fill: '#F4EEFF' },
  { fill: null, stroke: '#9FE8D0' },
  { fill: '#8FC2FF' },
  { fill: '#F4EEFF' },
  { fill: null, stroke: '#F9A8D4' },
];

// Hand-drawn doodles: [path, appear-start, appear-end, colour, width]
const DOODLES: { d: string; a: number; b: number; c: string; w: number }[] = [
  // scribble underline (two strokes)
  { d: 'M300 640 C 520 665, 760 612, 1010 640 S 1300 625, 1310 636', a: 0.74, b: 0.82, c: '#FF9B7A', w: 9 },
  { d: 'M360 690 C 600 668, 840 704, 1100 678 S 1240 684, 1250 680', a: 0.78, b: 0.85, c: '#FF9B7A', w: 6 },
  // loop around the last letter
  { d: 'M1285 330 C 1400 300, 1500 400, 1450 520 C 1400 640, 1230 600, 1235 470 C 1240 350, 1360 300, 1440 340', a: 0.8, b: 0.9, c: '#F9A8D4', w: 6 },
  // curved arrow pointing at the word + head
  { d: 'M210 790 C 250 700, 310 650, 390 640', a: 0.82, b: 0.88, c: '#9FE8D0', w: 6 },
  { d: 'M352 612 L 392 640 L 346 668', a: 0.87, b: 0.9, c: '#9FE8D0', w: 6 },
  // big sparkle (top-left)
  { d: 'M250 150 L 268 215 L 330 232 L 268 250 L 250 315 L 232 250 L 170 232 L 232 215 Z', a: 0.7, b: 0.78, c: '#FDE68A', w: 5 },
  // small sparkle
  { d: 'M470 100 L 480 130 L 510 140 L 480 150 L 470 180 L 460 150 L 430 140 L 460 130 Z', a: 0.76, b: 0.82, c: '#FDE68A', w: 4 },
  // spiral (top-right)
  { d: 'M1230 140 C 1260 90, 1340 100, 1340 160 C 1340 220, 1260 225, 1250 170 C 1245 135, 1290 125, 1300 160 C 1305 180, 1280 186, 1277 168', a: 0.72, b: 0.82, c: '#8FC2FF', w: 5 },
  // zig-zag (bottom-right)
  { d: 'M1220 780 L 1260 730 L 1300 790 L 1340 730 L 1380 790 L 1420 740', a: 0.84, b: 0.92, c: '#FDE68A', w: 6 },
  // little crosses
  { d: 'M110 520 L 150 560 M150 520 L 110 560', a: 0.8, b: 0.84, c: '#F9A8D4', w: 5 },
  { d: 'M1500 640 L 1536 676 M1536 640 L 1500 676', a: 0.83, b: 0.87, c: '#9FE8D0', w: 5 },
];

export default function ProjectsReveal() {
  const sceneRef = useRef<HTMLElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const midContentRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const doodleWrapRef = useRef<HTMLDivElement>(null);
  const doodleRefs = useRef<(SVGPathElement | null)[]>([]);
  const noteRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const vigRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const mid = midRef.current;
    const midContent = midContentRef.current;
    const fill = fillRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    const word = wordRef.current;
    const doodleWrap = doodleWrapRef.current;
    const note = noteRef.current;
    const hint = hintRef.current;
    const vig = vigRef.current;
    if (!scene || !mid || !midContent || !fill || !left || !right || !word || !doodleWrap) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const update = (p: number) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const narrow = W < 700;

      // ---- the three big boxes ----
      const midW0 = narrow ? W * 0.8 : W * 0.54;
      const midH0 = H * (narrow ? 0.74 : 0.8);
      const sideW = midW0 * 0.9;
      const sideH = midH0 * 0.86;
      const gap = narrow ? 12 : W * 0.016;

      const t = ease(clamp((p - 0.06) / 0.5)); // growth 0.06 .. 0.56
      mid.style.width = `${midW0 + (W - midW0) * t}px`;
      mid.style.height = `${midH0 + (H - midH0) * t}px`;
      mid.style.borderRadius = `${32 * (1 - t)}px`;
      midContent.style.opacity = `${clamp(1 - t * 2.2)}`;
      midContent.style.transform = `scale(${1 + t * 0.25})`;
      fill.style.opacity = `${clamp(t * 1.5)}`;

      const slide = easeOut(clamp((p - 0.03) / 0.38));
      const sideX = midW0 / 2 + gap + sideW / 2 + slide * (W * 0.5);
      const sideOp = clamp(1 - slide * 1.2);
      const place = (el: HTMLDivElement, dir: number) => {
        el.style.width = `${sideW}px`;
        el.style.height = `${sideH}px`;
        el.style.setProperty('--sh', `${sideH}px`);
        el.style.opacity = `${sideOp}`;
        el.style.transform = `translate3d(calc(-50% + ${dir * sideX}px), calc(-50% + ${slide * 40}px), 0) rotate(${dir * slide * 9}deg) scale(${1 - slide * 0.25})`;
      };
      place(left, -1);
      place(right, 1);

      // ---- letters ----
      const fs = Math.min(W * 0.14, H * 0.3);
      word.style.fontSize = `${fs}px`;
      WORD.forEach((_, i) => {
        const el = letterRefs.current[i];
        if (!el) return;
        const s = SCATTER[i];
        const q = ease(clamp((p - 0.12 - i * 0.038) / 0.4));
        const k = 1 - q;
        const fx = s.x * W * 0.65 * k;
        const fy = s.y * H * 0.62 * k;
        el.style.opacity = `${clamp(q * 4)}`;
        el.style.filter = k > 0.02 ? `blur(${(k * 14).toFixed(1)}px)` : 'none';
        el.style.transform = `translate3d(${fx.toFixed(1)}px, ${(fy + NUDGE[i] * fs * q).toFixed(1)}px, 0) rotate(${(s.rot * k + TILT[i] * q).toFixed(1)}deg) scale(${(1 + (s.scale - 1) * k).toFixed(3)})`;
      });

      // ---- exit ----
      const x = ease(clamp((p - 0.9) / 0.1));
      word.style.opacity = `${1 - x}`;
      word.style.transform = `translate3d(0, ${-x * H * 0.12}px, 0)`;
      doodleWrap.style.opacity = `${1 - x}`;
      doodleWrap.style.transform = `translate3d(0, ${-x * H * 0.12}px, 0)`;
      fill.style.opacity = `${clamp(t * 1.5) * (1 - x)}`;
      // the box's own border/shadow must vanish with the fill (they were the visible "line")
      mid.style.opacity = `${1 - x}`;
      // give this scene the SAME edge shading as the Projects section so the two regions match
      if (vig) vig.style.opacity = `${x}`;

      // ---- doodles draw themselves ----
      DOODLES.forEach((dd, i) => {
        const el = doodleRefs.current[i];
        if (!el) return;
        const u = clamp((p - dd.a) / (dd.b - dd.a));
        el.style.strokeDashoffset = `${1 - u}`;
        el.style.opacity = u > 0 ? '1' : '0';
      });
      if (note) {
        const n = clamp((p - 0.86) / 0.05);
        note.style.opacity = `${n * (1 - x)}`;
        note.style.transform = `translate3d(0, ${(1 - n) * 14 - x * H * 0.12}px, 0) rotate(-6deg)`;
      }
      if (hint) hint.style.opacity = `${clamp(1 - p * 14)}`;
    };

    if (reduce) {
      update(0.88);
      return;
    }
    update(0);
    const st = ScrollTrigger.create({
      trigger: scene,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    const onResize = () => update(st.progress);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      st.kill();
    };
  }, []);

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // a big box: colour, motivational words, a doodle.
  // Side boxes are cropped by the screen edge, so their words run VERTICALLY along the edge that
  // faces the middle box (always inside the visible strip). The middle box uses big horizontal words.
  const box = (
    bg: string,
    accent: string,
    tag: string,
    lines: string[],
    doodle: 'gear' | 'rocket' | 'wrench',
    side?: 'left' | 'right',
  ) => {
    const doodleSvg = (
      <>
        {doodle === 'gear' && (<><circle cx="50" cy="50" r="16" /><path d="M50 12 V28 M50 72 V88 M12 50 H28 M72 50 H88 M23 23 L34 34 M66 66 L77 77 M77 23 L66 34 M34 66 L23 77" /></>)}
        {doodle === 'rocket' && (<><path d="M50 8 C72 28 72 60 62 78 H38 C28 60 28 28 50 8 Z" /><circle cx="50" cy="42" r="7" /><path d="M38 78 L26 94 M62 78 L74 94 M50 82 V98" /></>)}
        {doodle === 'wrench' && (<path d="M70 20 A18 18 0 0 0 52 44 L16 80 L24 88 L60 52 A18 18 0 0 0 84 34 L72 46 L60 38 L58 26 Z" />)}
      </>
    );
    const longest = Math.max(...lines.map((l) => l.length));
    // vertical text size: the longest line must fit in ~62% of the box height
    const vFont = `calc(var(--sh, 600px) * ${(0.62 / (longest * 0.8)).toFixed(3)})`;
    const inner = side === 'left' ? 'right-6' : 'left-6';
    return (
      <div className="relative w-full h-full overflow-hidden rounded-[inherit]" style={{ background: bg }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 25% 15%, rgba(255,255,255,0.25), transparent 55%)' }} />
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(rgba(255,255,255,0.35) 1.5px, transparent 2px) 0 0 / 26px 26px' }} />
        {side ? (
          <>
            <div className={`absolute top-5 ${inner} font-mono text-[11px] tracking-[0.3em] uppercase text-white/85`}>{tag}</div>
            <svg className={`wobble-doodle absolute ${inner} top-14 w-[18%] max-w-[90px] opacity-90`} viewBox="0 0 100 100" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              {doodleSvg}
            </svg>
            <div
              className={`absolute ${inner} bottom-6 text-white leading-[0.95] whitespace-nowrap`}
              style={{
                ...MARKER,
                fontSize: vFont,
                writingMode: side === 'left' ? 'vertical-rl' : 'vertical-lr',
                transform: side === 'left' ? 'rotate(180deg)' : undefined,
                textShadow: '3px 3px 0 rgba(0,0,0,0.25)',
              }}
            >
              {lines.map((l, i) => (<div key={i}>{l}</div>))}
            </div>
          </>
        ) : (
          <>
            <div className="absolute top-5 left-6 font-mono text-[11px] tracking-[0.3em] uppercase text-white/85">{tag}</div>
            <svg className="wobble-doodle absolute right-6 top-6 w-[16%] max-w-[120px] opacity-90" viewBox="0 0 100 100" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              {doodleSvg}
            </svg>
            <div className="absolute left-6 right-6 bottom-8 text-white leading-[0.92]" style={{ ...MARKER, fontSize: 'clamp(54px, 9.5vw, 150px)', textShadow: '4px 4px 0 rgba(0,0,0,0.25)' }}>
              {lines.map((l, i) => (<div key={i}>{l}</div>))}
            </div>
            <svg className="wobble-doodle absolute left-6 bottom-4 w-[45%] h-4" viewBox="0 0 200 16" preserveAspectRatio="none" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round">
              <path d="M4 9 C 30 2, 50 14, 80 8 S 140 4, 196 9" />
            </svg>
          </>
        )}
      </div>
    );
  };

  return (
    <section
      ref={sceneRef}
      id="projects-reveal"
      className="relative w-full"
      style={{ height: reduceMotion ? '80vh' : `${SCENE_VH}vh` }}
      aria-label="Projects intro"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={reduceMotion ? { height: '80vh' } : undefined}>
        {/* same vignette as the Projects section, faded in at the end so there is no shade line */}
        <div
          ref={vigRef}
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,4,14,0.55) 100%)' }}
        />

        {/* side boxes */}
        <div ref={leftRef} className="absolute left-1/2 top-1/2 rounded-[32px] overflow-hidden border-2 border-white/30 shadow-[0_30px_90px_rgba(5,3,20,0.6)] will-change-transform">
          {box('linear-gradient(145deg,#E8693D,#6B230E)', '#FDE68A', '01 / idea', ['BUILD.'], 'gear', 'left')}
        </div>
        <div ref={rightRef} className="absolute left-1/2 top-1/2 rounded-[32px] overflow-hidden border-2 border-white/30 shadow-[0_30px_90px_rgba(5,3,20,0.6)] will-change-transform">
          {box('linear-gradient(145deg,#22B386,#0A3025)', '#FDE68A', '03 / repeat', ['BREAK. FIX.', 'REPEAT.'], 'wrench', 'right')}
        </div>

        {/* middle box: swells to the full screen */}
        <div ref={midRef} className="absolute left-1/2 top-1/2 overflow-hidden border-2 border-white/30 shadow-[0_30px_100px_rgba(5,3,20,0.65)] will-change-[width,height]" style={{ transform: 'translate(-50%, -50%)' }}>
          <div ref={midContentRef} className="absolute inset-0 will-change-transform">
            {box('linear-gradient(145deg,#8C84F0,#2A2370)', '#FDE68A', '02 / ship', ['SHIP', 'IT.'], 'rocket')}
          </div>
          <div
            ref={fillRef}
            className="absolute inset-0"
            style={{
              opacity: 0,
              background: 'radial-gradient(rgba(255,255,255,0.10) 2px, transparent 2.5px) 0 0 / 30px 30px, linear-gradient(180deg, #4A2FB0 0%, #1C1648 100%)',
            }}
          />
        </div>

        {/* hand-drawn doodles around the word (stay after they are drawn) */}
        <div ref={doodleWrapRef} className="absolute inset-0 pointer-events-none">
          <svg className="wobble-doodle absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {DOODLES.map((dd, i) => (
              <path
                key={i}
                ref={(el) => { doodleRefs.current[i] = el; }}
                d={dd.d}
                stroke={dd.c}
                strokeWidth={dd.w}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
                style={{ opacity: 0 }}
              />
            ))}
          </svg>
        </div>

        {/* PROJECTS: letters fly in and settle crooked, like hand-cut type */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            ref={wordRef}
            className="flex items-center justify-center leading-none select-none will-change-transform"
            style={{ ...MARKER, letterSpacing: '0.02em' }}
            aria-label="Projects"
            role="heading"
            aria-level={2}
          >
            {WORD.map((ch, i) => {
              const look = LOOK[i];
              return (
                <span
                  key={i}
                  ref={(el) => { letterRefs.current[i] = el; }}
                  aria-hidden="true"
                  className="inline-block will-change-transform"
                  style={{
                    opacity: 0,
                    color: look.fill ?? 'transparent',
                    WebkitTextStroke: look.stroke ? `3px ${look.stroke}` : undefined,
                    textShadow: look.fill ? '0.05em 0.05em 0 rgba(10,6,40,0.45)' : undefined,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>

        {/* handwritten note, bottom-left next to the arrow */}
        <div
          ref={noteRef}
          className="absolute left-[7%] bottom-[10%] text-[#9FE8D0] text-xl sm:text-3xl pointer-events-none"
          style={{ ...MARKER, opacity: 0 }}
        >
          things we actually shipped
        </div>

        <div ref={hintRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.3em] uppercase text-white/80 pointer-events-none">
          Scroll
        </div>
      </div>
    </section>
  );
}
