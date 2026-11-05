import { useState, useRef, useEffect } from 'react';
import { PROJECTS, Project } from '../data/club';
import { glowStyle, hexToRgb } from '../utils/glow';
import { setMascot } from '../utils/mascotStore';
import { scrollToY } from '../utils/scroll';
import { ExternalLink, X, Github, Sparkles, Code2, Bot, Cloud, Award, Radio } from 'lucide-react';

interface ProjectsSectionProps {
  scrollProgress: number;
}

const SERIF = { fontFamily: 'Georgia, "Times New Roman", serif' } as const;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

// How much scrolling each project needs, in screen-heights (was 1.5). Lower = a smaller scroll
// moves to the next project. This is the one number to tweak if you want it quicker/slower.
const SCROLL_PER_PROJECT_VH = 0.5;
// Snap: once you move more than this fraction of a project in one direction and let go,
// the reel glides on to the next project by itself (0.12 = a tiny nudge is enough).
const SNAP_THRESHOLD = 0.12;
// One scroll = one project. Only a really big scroll (this many projects or more in one go) skips
// ahead by several. Raise it to make skipping rarer, lower it to make skipping easier.
const SKIP_LIMIT = 3.5;
const SNAP_DURATION = 0.9;
// Step scrolling (wheel / trackpad / swipe): every scroll gesture jumps straight to the next project.
// Only a really fast, big gesture jumps further. Tweak these to taste:
const STEP_DURATION = 0.8;      // seconds for the glide to the next project
const FAST_START = 900;         // wheel/trackpad: gesture size (px, counted in its first 0.25s) before it starts skipping
const FAST_PER = 450;           // ...and every extra this many px skips one more project
const GESTURE_WINDOW = 260;     // ms in which a gesture's size is measured
const FAST_SWIPE = 1.8;         // touch: finger speed (px/ms) above which a swipe skips several // seconds, uses the same smooth Lenis easing as the rest of the page
// Each project has its own frame shape, like a magazine layout (portrait / landscape mix)
const RATIOS = [4 / 5, 4 / 3, 3 / 4, 16 / 10, 1];

/** "Project name 01: RoboStack Rover" -> { first: "RoboStack", rest: "Rover" } */
function splitTitle(title: string) {
  const name = title.includes(':') ? title.split(':').slice(1).join(':').trim() : title;
  const [first, ...rest] = name.split(' ');
  return { first, rest: rest.join(' ') };
}


/** Description card with a hand-drawn "scribble out" + 3D tumble when it switches. */
function DescPanel({
  proj, index, d, right, isDesktop, onOpen,
}: { proj: Project; index: number; d: number; right: boolean; isDesktop: boolean; onOpen: () => void }) {
  const enter = smooth(clamp((0.1 - d) / 0.22));       // d 0.1 -> -0.12
  const exitP = clamp((-0.5 - d) / 0.28);               // d -0.5 -> -0.78
  const scribble = clamp(exitP * 1.7);                  // crossing-out lines draw first
  const fade = smooth(clamp((exitP - 0.35) / 0.65));    // then the card tumbles away
  const opacity = enter * (1 - fade);
  if (opacity <= 0.01) return null;
  const color = proj.verticalColor;
  const lines = proj.descriptionLines;
  const dir = right ? 1 : -1;
  const tumble = (1 - enter) * -65 + fade * 75;         // rotateX: falls in from below, flips up and away
  const spin = (1 - enter) * 14 * dir + fade * -10 * dir;

  return (
    <div
      className="absolute z-20"
      style={{
        opacity,
        pointerEvents: opacity > 0.6 ? 'auto' : 'none',
        perspective: 900,
        ...(isDesktop
          ? { top: '50%', [right ? 'left' : 'right']: '4vw', width: '22vw', maxWidth: 360, transform: 'translateY(-46%)' }
          : { left: '5vw', right: '5vw', bottom: '56px' }),
      }}
    >
      <div
        className="relative"
        style={{
          transformOrigin: '50% 100%',
          transform: `rotateX(${tumble}deg) rotateZ(${spin}deg) translateY(${(1 - enter) * 40 - fade * 30}px)`,
          filter: fade > 0 ? `blur(${fade * 5}px)` : undefined,
        }}
      >
        <div className={`glass rounded-2xl overflow-hidden ${isDesktop ? 'p-5 sm:p-6' : 'p-4'}`} style={glowStyle(color)}>
          {/* giant outlined index number */}
          <div
            className="absolute -top-3 right-2 font-display font-black leading-none pointer-events-none select-none"
            style={{ fontSize: isDesktop ? 88 : 56, color: 'transparent', WebkitTextStroke: `1.5px rgb(${hexToRgb(color)} / 0.55)` }}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="relative flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase">
            <span className="px-2 py-0.5 rounded glass-chip" style={{ color }}>{proj.vertical}</span>
            <span className="text-[#A7A3C7]">{proj.badge}</span>
          </div>
          <p className={`relative text-[#E6EDF7] leading-snug ${isDesktop ? 'mt-4 text-base sm:text-[17px]' : 'mt-3 text-sm pr-12'}`}>{lines[0]}</p>
          {isDesktop && (
            <dl className="relative mt-4 space-y-2.5 text-xs leading-relaxed text-[#A7A3C7]">
              <div><dt className="font-mono uppercase tracking-widest text-[10px] text-[#E6EDF7]">Build</dt><dd>{lines[1]}</dd></div>
              <div><dt className="font-mono uppercase tracking-widest text-[10px] text-[#5DCAA5]">Status</dt><dd>{lines[3]}</dd></div>
            </dl>
          )}
          <div className={`relative flex flex-wrap gap-1.5 ${isDesktop ? 'mt-4' : 'mt-3'}`}>
            {proj.tags.slice(0, isDesktop ? 5 : 3).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-md font-mono text-[10px] glass-chip">{t}</span>
            ))}
          </div>
          <button onClick={onOpen} className={`relative inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#67E8F9] hover:text-white cursor-pointer ${isDesktop ? 'mt-5' : 'mt-3'}`}>
            Open project <span aria-hidden>↗</span>
          </button>

          {/* doodle: scribble-out lines that draw across the card as it leaves */}
          <svg className="wobble-doodle absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 300" preserveAspectRatio="none" fill="none">
            {['M8 40 L292 70 L10 110 L290 150', 'M12 170 L288 200 L14 240 L286 270'].map((path, k) => (
              <path
                key={k}
                d={path}
                stroke={color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - clamp(scribble * 2 - k)}
                opacity={scribble > 0 ? 0.9 : 0}
              />
            ))}
          </svg>
        </div>

        {/* doodles around the card: pop in on arrival */}
        <svg
          className="wobble-doodle absolute -top-7 -left-6 w-14 h-14 pointer-events-none"
          viewBox="0 0 60 60" fill="none"
          style={{ transform: `scale(${enter}) rotate(${(1 - enter) * -40}deg)`, color }}
        >
          <path d="M30 6 L35 24 L54 30 L35 36 L30 54 L25 36 L6 30 L25 24 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
        <svg
          className="wobble-doodle absolute -bottom-8 -right-5 w-24 h-10 pointer-events-none text-[#67E8F9]"
          viewBox="0 0 100 40" fill="none"
          style={{ opacity: enter }}
        >
          <path
            d="M4 28 Q 22 4, 40 22 T 76 18 M 66 8 L 78 18 L 64 28"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - enter}
          />
        </svg>
      </div>
    </div>
  );
}

export default function ProjectsSection(_props: ProjectsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [p, setP] = useState(0); // 0..1 progress through the pinned reel
  const [view, setView] = useState<'grid' | 'list'>('grid'); // GRID = image reel, LIST = big title list
  const sectionRef = useRef<HTMLElement>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setIsDesktop(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const filterTabs = ['ALL', 'B/Algo', 'B/Uild', 'B/Hack', 'B/Dev'];
  const projects = activeFilter === 'ALL' ? PROJECTS : PROJECTS.filter((x) => x.vertical === activeFilter);
  const n = projects.length;

  // Scroll progress through the pinned section
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const travel = el.offsetHeight - window.innerHeight;
      setP(travel > 0 ? clamp(-r.top / travel) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [n]);

  // Snap to projects: after you stop scrolling (and lift your finger), glide to the next/previous
  // project if you moved even a little in that direction, instead of resting half-way between two.
  useEffect(() => {
    let timer = 0;
    let touching = false;
    let lastY = window.scrollY;
    let snapping = false;
    let snapTimer = 0;

    const geometry = () => {
      const el = sectionRef.current;
      if (!el) return null;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const travel = el.offsetHeight - window.innerHeight;
      return travel > 0 ? { top, travel } : null;
    };
    // scroll position (px) where the reel shows `pos` (-1 = intro, 0..n-1 = projects)
    const yForPos = (g: { top: number; travel: number }, pos: number) => g.top + ((pos + 1) / (n + 0.5)) * g.travel;

    // The project we are resting on. One gesture moves you exactly one project from here,
    // unless the gesture was so big that it passed SKIP_LIMIT projects (then it skips several).
    let anchor: number | null = null;

    const settle = () => {
      if (touching) { timer = window.setTimeout(settle, 120); return; }
      const g = geometry();
      if (!g) return;
      const y = window.scrollY;
      if (y < g.top - 2 || y > g.top + g.travel + 2) { anchor = null; return; } // outside the pinned reel
      const cur = ((y - g.top) / g.travel) * (n + 0.5) - 1;
      if (anchor === null) anchor = clamp(Math.round(cur), -1, n - 1);

      const delta = cur - anchor;
      const dist = Math.abs(delta);
      const sign = delta >= 0 ? 1 : -1;
      let steps = 0;
      if (dist >= SNAP_THRESHOLD) steps = dist < SKIP_LIMIT ? 1 : Math.round(dist); // small/medium = 1, huge = several
      const target = anchor + sign * steps;

      let targetY: number;
      if (target > n - 1) {
        // on the last project and still going down: let the page carry on out of the reel
        if (cur > n - 1 + SNAP_THRESHOLD) { targetY = g.top + g.travel; anchor = null; }
        else { targetY = yForPos(g, n - 1); anchor = n - 1; }
      } else {
        anchor = Math.max(-1, target);
        targetY = yForPos(g, anchor);
      }
      if (Math.abs(targetY - y) < 3) return;
      snapping = true;
      scrollToY(targetY, SNAP_DURATION);
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => { snapping = false; }, SNAP_DURATION * 1000 + 150);
    };

    // ---- step scrolling: one wheel / trackpad / swipe gesture = one project ----
    let gDir = 0, gAcc = 0, gStart = 0, gBase = 0, gSteps = 0, lastEvt = 0, lastAbs = 0, lockedUntil = 0;

    const stage = () => {
      const g = geometry();
      if (!g) return null;
      const y = window.scrollY;
      if (y < g.top - 1 || y > g.top + g.travel + 1) return null; // not inside the pinned reel
      const cur = ((y - g.top) / g.travel) * (n + 0.5) - 1;
      if (anchor === null) anchor = clamp(Math.round(cur), -1, n - 1);
      return { g, y };
    };
    // can this direction still move inside the reel? (otherwise let the page scroll on normally)
    const canStep = (d: number) => anchor !== null && (d > 0 ? anchor < n - 1 : anchor > -1);

    const go = (g: { top: number; travel: number }, idx: number) => {
      anchor = clamp(idx, -1, n - 1);
      snapping = true;
      scrollToY(yForPos(g, anchor), STEP_DURATION);
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => { snapping = false; }, STEP_DURATION * 1000 + 150);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom
      const st = stage();
      if (!st) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const dy = e.deltaY * unit;
      if (dy === 0) return;
      const d = dy > 0 ? 1 : -1;
      if (!canStep(d)) return; // edge of the reel: page carries on
      e.preventDefault();
      e.stopImmediatePropagation(); // keep Lenis out of it, we move the page ourselves
      const now = performance.now();
      const abs = Math.abs(dy);
      const gap = now - lastEvt;
      lastEvt = now;
      const fresh = gap > 110 || d !== gDir || (abs > lastAbs * 2 && abs > 40);
      lastAbs = abs;
      if (fresh) {
        if (now < lockedUntil) return; // still gliding from the previous step
        gDir = d; gAcc = abs; gStart = now; gBase = anchor as number; gSteps = 0;
      } else if (now - gStart < GESTURE_WINDOW) {
        gAcc += abs;
      } else {
        return; // the long inertia tail of a trackpad swipe: ignore it
      }
      const want = 1 + Math.floor(Math.max(0, gAcc - FAST_START) / FAST_PER);
      if (want > gSteps) {
        gSteps = want;
        lockedUntil = now + 450;
        go(st.g, gBase + d * gSteps);
      }
    };

    // touch swipes
    let tY = 0, tT = 0, tOn = false, tMoved = false;
    const onTouchStart = (e: TouchEvent) => {
      touching = true;
      tOn = !!stage() && e.touches.length === 1;
      tY = e.touches[0].clientY; tT = performance.now(); tMoved = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!tOn) return;
      const dy = tY - e.touches[0].clientY;
      if (Math.abs(dy) < 4) return;
      if (!canStep(dy > 0 ? 1 : -1)) { tOn = false; return; } // at the edge: native scroll
      if (e.cancelable) e.preventDefault();
      tMoved = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      touching = false;
      if (!tOn || !tMoved) return;
      const st = stage();
      if (!st) return;
      const dy = tY - e.changedTouches[0].clientY;
      const dt = Math.max(1, performance.now() - tT);
      const v = Math.abs(dy) / dt;
      if (Math.abs(dy) < 24 && v < 0.25) return;
      const d = dy > 0 ? 1 : -1;
      if (!canStep(d)) return;
      if (performance.now() < lockedUntil) return;
      const steps = v > FAST_SWIPE ? Math.min(5, Math.max(2, Math.round(v * 1.2))) : 1;
      lockedUntil = performance.now() + 450;
      go(st.g, (anchor as number) + d * steps);
    };

    const onScroll = () => {
      const y = window.scrollY;
      lastY = y;
      window.clearTimeout(timer);
      if (!snapping) timer = window.setTimeout(settle, 140);
    };
    const up = () => { touching = false; };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', up, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', up);
      window.clearTimeout(timer);
      window.clearTimeout(snapTimer);
    };
  }, [n]);

  // Render animated procedural SVG illustration per project
  const renderIllustration = (type: Project['illustrationSvg'], color: string) => {
    switch (type) {
      case 'rover':
        return (
          <svg className="w-full h-full text-[#E6EDF7]" viewBox="0 0 160 120" fill="none">
            {/* Rover Chassis */}
            <rect x="35" y="45" width="90" height="35" rx="6" fill="#0B0A16" />
            <rect x="45" y="32" width="40" height="15" rx="3" fill="#67E8F9" />
            {/* Spinning wheels */}
            <circle cx="45" cy="85" r="14" fill="#0B1226" stroke="#E6EDF7" strokeWidth="3" />
            <circle cx="80" cy="85" r="14" fill="#0B1226" stroke="#E6EDF7" strokeWidth="3" />
            <circle cx="115" cy="85" r="14" fill="#0B1226" stroke="#E6EDF7" strokeWidth="3" />
            {/* Antenna with radio waves */}
            <line x1="100" y1="45" x2="115" y2="20" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round" />
            <circle cx="115" cy="20" r="4" fill="#67E8F9" />
            <path d="M 120 12 A 12 12 0 0 1 126 24" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'code':
        return (
          <svg className="w-full h-full text-[#E6EDF7]" viewBox="0 0 160 120" fill="none">
            {/* Terminal Window */}
            <rect x="25" y="20" width="110" height="75" rx="8" fill="#0B0A16" />
            <circle cx="40" cy="32" r="3.5" fill="#F0997B" />
            <circle cx="50" cy="32" r="3.5" fill="#67E8F9" />
            <circle cx="60" cy="32" r="3.5" fill="#5DCAA5" />
            {/* Code lines */}
            <line x1="38" y1="50" x2="75" y2="50" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
            <line x1="82" y1="50" x2="110" y2="50" stroke="#E6EDF7" strokeWidth="4" strokeLinecap="round" />
            <line x1="48" y1="64" x2="95" y2="64" stroke="#67E8F9" strokeWidth="4" strokeLinecap="round" />
            <line x1="48" y1="78" x2="80" y2="78" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );
      case 'cloud':
        return (
          <svg className="w-full h-full text-[#E6EDF7]" viewBox="0 0 160 120" fill="none">
            {/* P2P Cloud & Nodes */}
            <path
              d="M 50 70 A 20 20 0 0 1 70 45 A 25 25 0 0 1 115 50 A 18 18 0 0 1 120 70 Z"
              fill="#378ADD"
            />
            <circle cx="45" cy="80" r="7" fill="#0B0A16" stroke="#67E8F9" strokeWidth="2" />
            <circle cx="80" cy="88" r="7" fill="#0B0A16" stroke="#67E8F9" strokeWidth="2" />
            <circle cx="115" cy="80" r="7" fill="#0B0A16" stroke="#67E8F9" strokeWidth="2" />
            <line x1="45" y1="80" x2="80" y2="88" stroke="#0B0A16" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="80" y1="88" x2="115" y2="80" stroke="#0B0A16" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
        );
      case 'trophy':
        return (
          <svg className="w-full h-full text-[#E6EDF7]" viewBox="0 0 160 120" fill="none">
            {/* Hackathon Trophy */}
            <path d="M 55 30 L 105 30 L 95 65 A 15 15 0 0 1 65 65 Z" fill="#D85A30" />
            <path d="M 55 35 C 40 35 40 55 58 55" stroke="#0B0A16" strokeWidth="3" fill="none" />
            <path d="M 105 35 C 120 35 120 55 102 55" stroke="#0B0A16" strokeWidth="3" fill="none" />
            <rect x="75" y="65" width="10" height="20" fill="#0B0A16" />
            <rect x="60" y="85" width="40" height="12" rx="3" fill="#0B0A16" />
            <circle cx="80" cy="46" r="6" fill="#67E8F9" />
          </svg>
        );
      case 'iot':
        return (
          <svg className="w-full h-full text-[#E6EDF7]" viewBox="0 0 160 120" fill="none">
            {/* IoT Beacon & Solar */}
            <rect x="60" y="45" width="40" height="45" rx="6" fill="#1D9E75" />
            <polygon points="50,45 80,25 110,45" fill="#67E8F9" />
            <circle cx="80" cy="65" r="8" fill="#0B0A16" />
            {/* Signal waves */}
            <path d="M 95 55 A 16 16 0 0 1 105 75" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 102 48 A 24 24 0 0 1 114 82" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      default:
        return null;
    }
  };


  // pos: -1 = intro statement, 0..n-1 = project index (continuous while scrolling)
  const pos = p * (n + 0.5) - 1;
  const activeIdx = clamp(Math.round(pos), 0, Math.max(0, n - 1));
  const introD = (pos + 1) / 0.45; // 0 at top -> 1 when the intro has gone
  // The reel's dark edge-vignette and colour tints live inside the pinned stage. When the stage
  // unpins and scrolls away, their bottom edge would show up as a hard dark->light line against
  // the lighter Events section. So they fade out over the last stretch of the reel, which makes
  // the Projects shade melt into the page background before the stage leaves.
  const stageFade = 1 - smooth(clamp((p - 0.88) / 0.12));

  // feed the single page-level mascot: hoodie colour + a nudge when the project changes
  const mascotColor = pos < -0.45 ? '#7F77DD' : projects[activeIdx]?.verticalColor ?? '#7F77DD';
  useEffect(() => {
    setMascot({ color: mascotColor, kick: activeIdx, reel: true });
  }, [mascotColor, activeIdx]);

  const filters = (
    <div className="flex flex-wrap items-center gap-2">
      {filterTabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveFilter(tab)}
          className={`px-3.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
            activeFilter === tab
              ? 'bg-[#67E8F9]/20 text-[#67E8F9] border border-[#67E8F9]/60 shadow-[0_0_18px_rgba(103,232,249,0.45)]'
              : 'glass-chip text-[#A7A3C7] hover:text-[#E6EDF7]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  const preview = (proj: Project, cls = '') => (
    <div className={`relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br ${proj.previewGradient} flex items-center justify-center p-[8%] ${cls}`}>
      <div className="w-full h-full max-w-[420px]">{renderIllustration(proj.illustrationSvg, proj.verticalColor)}</div>
      <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded font-mono text-[9px] font-black glass-chip">{proj.badge}</span>
    </div>
  );


  // scroll position (px) at which the reel shows project `target` (used by list clicks)
  const yForProject = (target: number) => {
    const el = sectionRef.current;
    if (!el) return 0;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    return top + ((target + 1) / (n + 0.5)) * travel;
  };

  // Living background: every project paints the whole stage in its own colours (a big, blurred
  // copy of its picture), and the stage cross-fades between them as you scroll.
  const listMode = view === 'list';
  const bgLayers = projects.map((proj, i) => {
    const k = smooth(clamp(1 - Math.abs(pos - i - 0.1) * 1.15));
    const o = k * stageFade;
    if (o <= 0.01) return null;
    const rgb = hexToRgb(proj.verticalColor);
    return (
      <div key={`bg-${proj.id}`} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: o }}>
        <div className={`absolute inset-0 bg-gradient-to-br ${proj.previewGradient}`} />
        <div
          className="absolute flex items-center justify-center"
          style={{
            inset: '-20%',
            filter: `blur(${listMode ? 18 : 58}px) saturate(1.35)`,
            transform: `scale(${listMode ? 1.45 : 1.15}) rotate(${i % 2 === 0 ? -6 : 6}deg)`,
            opacity: listMode ? 0.8 : 0.6,
            transition: 'filter .7s ease, transform .7s ease, opacity .7s ease',
          }}
        >
          <div style={{ width: 'min(110vw, 150vh)', aspectRatio: '4 / 3' }}>{renderIllustration(proj.illustrationSvg, proj.verticalColor)}</div>
        </div>
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 65% 60% at ${i % 2 === 0 ? 68 : 32}% 50%, rgb(${rgb} / 0.5) 0%, rgb(${rgb} / 0.12) 55%, transparent 80%)` }}
        />
        <div className="absolute inset-0 transition-colors duration-700" style={{ background: `rgba(5,4,14,${listMode ? 0.5 : 0.56})` }} />
      </div>
    );
  });

  // LIST view: every project as a big title; the list glides with the same scroll, the one in the
  // middle lights up. Click the lit one to open it, any other to scroll straight to it.
  const ITEM_H = isDesktop ? 128 : 100;
  const listOpacity = smooth(clamp((pos + 0.6) / 0.6));
  const listView = (
    <div className="absolute inset-0" style={{ opacity: listOpacity, pointerEvents: listOpacity > 0.5 ? 'auto' : 'none' }}>
      {projects.map((proj, i) => {
        const d = i - pos; // >0 = still below the centre
        if (Math.abs(d) > 3.2) return null;
        const near = clamp(1 - Math.abs(d) * 0.55);
        const lit = clamp(1 - Math.abs(d) * 2.2);
        const { first, rest } = splitTitle(proj.title);
        return (
          <button
            key={`li-${proj.id}`}
            onClick={() => (Math.abs(d) < 0.35 ? setSelectedProject(proj) : scrollToY(yForProject(i), 1.1))}
            className="absolute left-0 right-0 text-center cursor-pointer"
            style={{
              top: '50%',
              opacity: 0.12 + near * 0.88 * (0.35 + 0.65 * lit),
              transform: `translate3d(0, calc(-50% + ${d * ITEM_H}px), 0) scale(${0.72 + 0.28 * lit})`,
              willChange: 'transform, opacity',
            }}
            aria-label={`Open ${proj.title}`}
          >
            <div className="font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase" style={{ color: proj.verticalColor, opacity: lit }}>
              {proj.vertical} · {proj.badge}
            </div>
            <div className="text-[#F4EEFF] text-4xl sm:text-6xl lg:text-7xl leading-[1.02]" style={{ textShadow: '0 4px 40px rgba(0,0,0,0.45)' }}>
              <span className="italic" style={SERIF}>{first}</span>{' '}
              <span className="font-display font-medium uppercase">{rest}</span>
            </div>
            {isDesktop && (
              <p className="mx-auto mt-2 max-w-[44ch] text-sm text-[#E6EDF7]/80" style={{ opacity: lit, maxHeight: lit > 0.05 ? 60 : 0, overflow: 'hidden' }}>
                {proj.descriptionLines[0]}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${((n + 0.5) * SCROLL_PER_PROJECT_VH + 1) * 100}vh` }}
      aria-label="Projects Section"
      data-cursor="view"
    >
        <div className="sticky top-0 h-screen w-full overflow-hidden select-none">
          {/* Living background: changes with every project */}
          {bgLayers}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: stageFade, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,4,14,0.55) 100%)' }} />

          {/* The hanging builder is the page-level StageMascot (one mascot for the whole transition + reel) */}

          {/* Intro statement with drifting project tiles */}
          <div className="absolute inset-0" style={{ opacity: clamp(1 - introD * 1.2), pointerEvents: 'none' }}>
            {projects.slice(0, 5).map((proj, i) => {
              const spots = [
                { l: '22%', t: '16%', w: 190 },
                { l: '40%', t: '58%', w: 120 },
                { l: '66%', t: '30%', w: 150 },
                { l: '72%', t: '66%', w: 230 },
                { l: '10%', t: '64%', w: 140 },
              ][i];
              return (
                <div
                  key={proj.id}
                  className="absolute glass rounded-lg p-1.5 hidden lg:block"
                  style={{
                    left: spots.l,
                    top: spots.t,
                    width: spots.w,
                    aspectRatio: '4 / 3',
                    transform: `translateY(${-introD * (80 + i * 50)}px) rotate(${(i - 2) * 2.5}deg)`,
                    ...glowStyle(proj.verticalColor),
                  }}
                >
                  {preview(proj)}
                </div>
              );
            })}
            <div className="absolute left-[8%] lg:left-[6%] top-[26%] max-w-[84vw] lg:max-w-[36vw] pr-6" style={{ transform: `translateY(${-introD * 60}px)` }}>
              <p className="text-[#E6EDF7] text-4xl sm:text-5xl lg:text-6xl leading-[1.05]" style={{ ...SERIF, textShadow: '0 0 40px rgba(139,92,246,0.55)' }}>
                We don&apos;t build what it looks like, we build what it <em>does</em>.
              </p>
              <p className="mt-6 font-mono text-xs tracking-widest text-[#A7A3C7] uppercase">Scroll to explore the work</p>
            </div>
          </div>

          {/* Project slides (masked so they fade out before touching the header) */}
          <div
            className="absolute inset-0"
            style={{
              // on phones the description card sits at the bottom, so don't fade the bottom edge
              WebkitMaskImage: isDesktop
                ? 'linear-gradient(to bottom, transparent 0%, transparent 12%, #000 20%, #000 88%, transparent 100%)'
                : 'linear-gradient(to bottom, transparent 0%, transparent 12%, #000 20%, #000 100%)',
              maskImage: isDesktop
                ? 'linear-gradient(to bottom, transparent 0%, transparent 12%, #000 20%, #000 88%, transparent 100%)'
                : 'linear-gradient(to bottom, transparent 0%, transparent 12%, #000 20%, #000 100%)',
            }}
          >
          {view === 'grid' && projects.map((proj, i) => {
            const d = i - pos;
            if (d > 0.55 || d < -1.1) return null;
            const right = i % 2 === 0; // even projects: image right, description left; odd: mirrored
            const ratio = RATIOS[i % RATIOS.length];
            const { first, rest } = splitTitle(proj.title);
            const active = d < 0.05 && d > -0.5;

            // Timeline (d = distance still to scroll until this project is centred):
            //  0.5..0.38  faint small teaser fades in (on the side of the previous description)
            //  0.3..0     teaser grows in place into the featured image
            //  0..-0.6    featured, description dwells
            // -0.6..-1.0  shrinks, drifts up, fades while the next teaser grows
            let scale = 1, opacity = 1, y = 0;
            if (d > 0.3) {
              const t = clamp((0.5 - d) / 0.12);
              scale = 0.34; opacity = 0.5 * smooth(t); y = 7;
            } else if (d > 0) {
              const t = smooth(1 - d / 0.3);
              scale = 0.34 + 0.66 * t; opacity = 0.5 + 0.5 * t; y = 7 * (d / 0.3);
            } else if (d < -0.6) {
              const u = clamp((-d - 0.6) / 0.4);
              scale = 1 - 0.22 * u; opacity = clamp(1 - u * 1.3); y = -u * 16;
            }
            if (!isDesktop && d > 0.3) opacity = 0; // no teaser on phones
            const labelOpacity = clamp(1 - d * 6) * clamp(1 - (-d - 0.5) * 6);
            const cx = isDesktop ? (right ? 72 : 28) : 50;
            const widthVw = isDesktop ? (ratio < 1 ? 27 : ratio > 1.2 ? 34 : 29) : ratio < 1 ? 66 : 86;
            // narrow windows: the image may never be taller than ~30% of the window, so it always
            // stays clear of the description card pinned below it
            // (on short phones it also shrinks so it clears the header above and the description card below)
            const widthCss = isDesktop
              ? `${widthVw}vw`
              : `min(${widthVw}vw, calc(${ratio.toFixed(3)} * clamp(110px, 100vh - 520px, 30vh)))`;
            const maxPx = ratio < 1 ? 430 : 600;

            return (
              <div key={proj.id}>
                <div
                  className="absolute top-1/2"
                  style={{
                    left: `${cx}%`,
                    ...(isDesktop ? {} : { top: 'max(22vh, 190px)' }),
                    width: widthCss,
                    maxWidth: maxPx,
                    opacity,
                    transform: isDesktop
                      ? `translate3d(-50%, calc(-46% + ${y}vh), 0) scale(${scale})`
                      : `translate3d(-50%, ${y}vh, 0) scale(${scale})`,
                    pointerEvents: active ? 'auto' : 'none',
                  }}
                >
                  <div
                    className="text-center mb-3"
                    // on phones the picture can be narrower than its title, so let the title use the screen width
                    style={isDesktop ? { opacity: labelOpacity } : { opacity: labelOpacity, width: '80vw', marginLeft: 'calc(50% - 40vw)' }}
                  >
                    <h3 className="text-[#E6EDF7] text-2xl sm:text-4xl leading-none">
                      <span className="italic" style={SERIF}>{first}</span>{' '}
                      <span className="font-display font-medium">{rest}</span>
                    </h3>
                    <div className="mt-1.5 font-mono text-xs tracking-[0.25em] uppercase" style={{ color: proj.verticalColor }}>
                      {proj.vertical}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProject(proj)}
                    className="group block w-full glass rounded-2xl p-2 cursor-pointer text-left"
                    style={{ aspectRatio: String(ratio), ...glowStyle(proj.verticalColor) }}
                    aria-label={`Open ${proj.title}`}
                  >
                    {preview(proj, 'transition-transform duration-700 group-hover:scale-[1.02]')}
                  </button>
                </div>

                <DescPanel proj={proj} index={i} d={d} right={right} isDesktop={isDesktop} onOpen={() => setSelectedProject(proj)} />
              </div>
            );
          })}
          {view === 'list' && listView}
          </div>

          {/* Header: title + filters */}
          <div className="absolute top-20 sm:top-24 left-4 sm:left-8 right-4 sm:right-8 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
            <h2 className="font-display font-black text-xl sm:text-2xl text-[#E6EDF7] tracking-tight">Things we built</h2>
            <div className="pointer-events-auto">{filters}</div>
          </div>

          {/* Bottom bar: counter / progress */}
          <div className="absolute bottom-6 left-4 sm:left-8 right-4 sm:right-8 flex items-center justify-end sm:justify-between font-mono text-xs tracking-widest text-[#A7A3C7]">
            <span className="hidden sm:inline uppercase">{String(activeIdx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
            {/* GRID / LIST switch */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 uppercase">
              {(['grid', 'list'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`relative pb-1 cursor-pointer transition-colors ${view === v ? 'text-[#F4EEFF]' : 'text-[#A7A3C7]/60 hover:text-[#E6EDF7]'}`}
                >
                  {v}
                  <span className="absolute left-0 right-0 bottom-0 h-px bg-[#67E8F9] transition-transform duration-300 origin-left" style={{ transform: `scaleX(${view === v ? 1 : 0})` }} />
                </button>
              ))}
            </div>
            <span className="flex items-center gap-2 uppercase">
              scroll
              <span className="inline-block w-16 h-px bg-white/20 relative overflow-hidden">
                <span className="absolute inset-y-0 left-0 bg-[#67E8F9]" style={{ width: `${p * 100}%` }} />
              </span>
              {Math.round(p * 100)}%
            </span>
          </div>
        </div>

      {/* Project Detail Modal on Click */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-2xl glass glass-flat glow-violet p-6 sm:p-8 text-[#E6EDF7] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#E6EDF7] cursor-pointer"
              aria-label="Close project modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-3 py-1 rounded text-xs font-mono font-bold uppercase text-white"
                style={{ backgroundColor: selectedProject.verticalColor }}
              >
                {selectedProject.vertical}
              </span>
              <span className="font-mono text-xs text-[#A7A3C7]">
                {selectedProject.badge}
              </span>
            </div>

            <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
              {selectedProject.title}
            </h3>

            {/* Illustration preview inside modal */}
            <div
              className={`w-full h-44 rounded-xl bg-gradient-to-br ${selectedProject.previewGradient} flex items-center justify-center p-4 my-5 border border-white/10`}
            >
              {renderIllustration(selectedProject.illustrationSvg, selectedProject.verticalColor)}
            </div>

            {/* What we learned */}
            <div className="space-y-4">
              <div>
                <h4 className="font-mono text-xs font-bold uppercase text-[#67E8F9] tracking-wider mb-2">
                  What we learned along the way:
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm text-[#A7A3C7]">
                  {selectedProject.learnedTakeaways.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#67E8F9] mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Team */}
              <div>
                <h4 className="font-mono text-xs font-bold uppercase text-white tracking-wider mb-1">
                  Built by the squad:
                </h4>
                <p className="font-mono text-xs text-[#A7A3C7]">
                  {selectedProject.builtBy.join(' · ')}
                </p>
              </div>

              {/* GitHub Link */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <a
                  href={selectedProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#E6EDF7] font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  <Github className="w-4 h-4" />
                  <span>Inspect GitHub Repo</span>
                </a>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="font-mono text-xs text-[#A7A3C7] hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
