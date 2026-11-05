import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Github, Linkedin, Mail } from 'lucide-react';
import { TEAM_MEMBERS, TeamMember, VERTICALS } from '../data/club';
import './TeamSection.css';

// "THE CREW!": a fanned hand of playful trading cards (see the Concept Capers reference).
// Front = photo + name + one short line. Click a card to flip it (role, verticals, links).
// Arrows, swipe, or the keyboard arrow keys deal the next card in.
//
// Auto deal: when the section scrolls into view the cards leave a messy pile and fly into the fan
// on their own (5 on desktop, 3 on phones) in about DEAL_MS. Once the last card lands the deck
// becomes the normal interactive carousel. No scrolling is needed to deal them.

const NAVY = '#14163F';
const DISPLAY = "'Bricolage Grotesque','Archivo Black',-apple-system,sans-serif";
const MONO = "'JetBrains Mono',monospace";

const SKINS = ['#F6D3B3', '#E8B98F', '#C68B5E', '#8D5A3B', '#FBE0C8'];
const HAIRS = ['#2A1B3D', '#4A2C1A', '#171717', '#7A3B1E', '#C9A227'];

// Cartoon fallback until a real photo is set via `photoUrl` in data/club.ts
function CartoonAvatar({ member, idx }: { member: TeamMember; idx: number }) {
  const skin = SKINS[idx % SKINS.length];
  const hair = HAIRS[(idx * 2 + 1) % HAIRS.length];
  const shirt = VERTICALS[member.verticals[0]]?.color ?? '#8B5CF6';
  const glasses = member.verticals.includes('B/Algo');
  const style = idx % 4;

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true" style={{ display: 'block' }}>
      {/* shoulders */}
      <path d="M14 200 C14 152 56 134 100 134 C144 134 186 152 186 200 Z" fill={shirt} stroke={NAVY} strokeWidth="4" strokeLinejoin="round" />
      <path d="M82 136 L100 160 L118 136" fill="none" stroke={NAVY} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      {/* neck */}
      <rect x="86" y="108" width="28" height="32" rx="8" fill={skin} stroke={NAVY} strokeWidth="4" />
      {/* hair behind head */}
      {style === 2 && (
        <g fill={hair} stroke={NAVY} strokeWidth="4">
          <circle cx="62" cy="62" r="22" />
          <circle cx="138" cy="62" r="22" />
          <circle cx="100" cy="46" r="26" />
        </g>
      )}
      {style === 3 && <circle cx="100" cy="30" r="17" fill={hair} stroke={NAVY} strokeWidth="4" />}
      {/* ears + head */}
      <circle cx="61" cy="88" r="8" fill={skin} stroke={NAVY} strokeWidth="4" />
      <circle cx="139" cy="88" r="8" fill={skin} stroke={NAVY} strokeWidth="4" />
      <ellipse cx="100" cy="84" rx="40" ry="44" fill={skin} stroke={NAVY} strokeWidth="4" />
      {/* hair on top */}
      {style === 0 && <path d="M58 76 C54 36 146 34 142 76 C132 56 70 54 58 76 Z" fill={hair} stroke={NAVY} strokeWidth="4" strokeLinejoin="round" />}
      {style === 1 && <path d="M58 80 C50 30 150 28 142 78 C130 62 104 52 84 56 C72 60 62 68 58 80 Z" fill={hair} stroke={NAVY} strokeWidth="4" strokeLinejoin="round" />}
      {style === 2 && <path d="M62 70 C70 50 130 50 138 70 C124 62 76 62 62 70 Z" fill={hair} stroke={NAVY} strokeWidth="4" strokeLinejoin="round" />}
      {style === 3 && <path d="M58 76 C56 38 144 38 142 76 C128 58 72 58 58 76 Z" fill={hair} stroke={NAVY} strokeWidth="4" strokeLinejoin="round" />}
      {/* face */}
      {glasses ? (
        <g stroke={NAVY} strokeWidth="4">
          <circle cx="82" cy="88" r="12" fill="#fff" />
          <circle cx="118" cy="88" r="12" fill="#fff" />
          <line x1="94" y1="88" x2="106" y2="88" />
          <circle cx="83" cy="89" r="3.5" fill={NAVY} stroke="none" />
          <circle cx="119" cy="89" r="3.5" fill={NAVY} stroke="none" />
        </g>
      ) : (
        <g fill={NAVY}>
          <ellipse cx="82" cy="89" rx="5" ry="6" />
          <ellipse cx="118" cy="89" rx="5" ry="6" />
          <circle cx="84" cy="87" r="1.8" fill="#fff" />
          <circle cx="120" cy="87" r="1.8" fill="#fff" />
        </g>
      )}
      <path d="M84 108 Q100 124 116 108" fill="none" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
      <circle cx="70" cy="104" r="6" fill="#F0997B" opacity="0.55" />
      <circle cx="130" cy="104" r="6" fill="#F0997B" opacity="0.55" />
    </svg>
  );
}

// ---- auto-deal helpers -------------------------------------------------------------
const DEAL_MS = 1400; // total time for the whole hand to be dealt (lower = faster)
const DEAL_START = 0; // progress (0-1) at which the first card leaves the pile
const DEAL_END = 1; // progress at which the last card has landed
const DEAL_OVERLAP = 2.2; // higher = cards fly out closer together (faster-feeling deal)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// seeded jitter so the pile looks hand-stacked (and is identical on every render)
const jit = (i: number) => ({
  r: Math.sin(i * 12.9898) * 4.5,
  x: Math.sin(i * 78.233) * 6,
  y: Math.cos(i * 37.719) * 4,
});

type Pose = { x: number; y: number; rot: number; s: number };
type Live = { p: number; offsets: number[]; scale: number; step: number; reach: number; compact: boolean };

// Where a card rests in the fan (same maths the carousel always used).
function fanPose({ off, scale, step, reach, compact }: { off: number; scale: number; step: number; reach: number; compact: boolean }): Pose & { abs: number } {
  const abs = Math.min(Math.abs(off), reach + 1);
  const c = Math.max(-reach - 1, Math.min(reach + 1, off));
  return {
    x: c * step * scale,
    y: (abs * abs * 9 + (abs === 0 ? -6 : 0)) * scale,
    rot: c * (compact ? 9 : 8),
    s: scale,
    abs,
  };
}

function useViewportSize() {
  const read = () => (typeof window === 'undefined' ? { w: 1200, h: 800 } : { w: window.innerWidth, h: window.innerHeight });
  const [size, setSize] = useState(read);
  useEffect(() => {
    const onResize = () => setSize(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export default function TeamSection() {
  const members = TEAM_MEMBERS;
  const total = members.length;
  const [active, setActive] = useState(Math.min(2, total - 1));
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const { w: width } = useViewportSize();
  const reducedMotion = usePrefersReducedMotion();

  const compact = width < 700;
  const scale = compact ? 0.78 : 0.88;
  const wide = width >= 1100; // only wide windows have room for two cards on each side
  const step = compact ? 140 : wide ? 232 : 200; // horizontal distance between neighbouring cards
  const reach = compact || !wide ? 1 : 2; // how many cards are visible on each side

  // With reduced motion we skip the animation and show the finished fan straight away.
  const autoDeal = !reducedMotion;

  const sectionRef = useRef<HTMLElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [settled, setSettled] = useState(!autoDeal); // true once every card has landed
  const settledRef = useRef(!autoDeal);

  const dragStart = useRef<number | null>(null);
  const didDrag = useRef(false);

  const go = (dir: number) => {
    if (!settledRef.current) return; // cards are still being dealt
    setFlipped({});
    setActive((a) => (a + dir + total) % total);
  };

  const toggleFlip = (id: string) => {
    if (didDrag.current || !settledRef.current) return;
    setFlipped((f) => ({ ...f, [id]: !f[id] }));
  };

  const offsets = useMemo(
    () =>
      members.map((_, i) => {
        let d = (i - active + total) % total;
        if (d > total / 2) d -= total;
        return d;
      }),
    [members, active, total]
  );

  // Latest values for the scroll handler (it must never re-render React on every animation frame).
  const live = useRef<Live>({ p: autoDeal ? 0 : 1, offsets, scale, step, reach, compact });
  live.current = { ...live.current, offsets, scale, step, reach, compact, p: autoDeal ? live.current.p : 1 };

  // Writes every card's transform / opacity / z-index straight to the DOM.
  const apply = useCallback(() => {
    const { p, offsets: offs, scale: sc, step: st, reach: rc, compact: cp } = live.current;
    const n = offs.length;

    // Deal order = the order cards leave the top of the pile: outer cards first (left before right),
    // the centre card last, so the pile never has a card poking out from under the one on top.
    const visible = offs
      .map((o, i) => ({ o, i }))
      .filter((v) => Math.abs(v.o) <= rc)
      .sort((a, b) => Math.abs(b.o) - Math.abs(a.o) || a.o - b.o);
    const shown = visible.length;
    const rank: number[] = new Array(n);
    visible.forEach((v, r) => (rank[v.i] = r));
    let extra = shown;
    offs.forEach((_, i) => {
      if (rank[i] === undefined) rank[i] = extra++;
    });

    // spacing between cards chosen so the LAST card finishes landing exactly at DEAL_END
    const slotLen = (DEAL_END - DEAL_START) / (shown - 1 + DEAL_OVERLAP);
    const dealing = p < DEAL_END;

    for (let i = 0; i < n; i++) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = rank[i];
      const j = jit(r);
      // pile pose: a slightly messy stack sitting where the centre card will end up
      const pile: Pose = { x: j.x * (1 - r / n) - r * 1.2, y: -6 * sc + j.y + r * 1.2, rot: j.r, s: sc };
      const fan = fanPose({ off: offs[i], scale: sc, step: st, reach: rc, compact: cp });

      let pose: Pose = pile;
      let op = 1;
      let z = 60 - r;

      if (Math.abs(offs[i]) <= rc) {
        // one card at a time leaves the pile and flies to its place in the fan
        const t0 = DEAL_START + r * slotLen;
        const t = easeInOut(clamp01((p - t0) / (slotLen * DEAL_OVERLAP)));
        const arc = -Math.sin(t * Math.PI) * 70 * sc; // small hop up out of the pile, then settle
        pose = { x: lerp(pile.x, fan.x, t), y: lerp(pile.y, fan.y, t) + arc, rot: lerp(pile.rot, fan.rot, t), s: lerp(pile.s, fan.s, t) };
        z = t > 0 && t < 1 ? 200 + r : t >= 1 ? 20 - fan.abs : 60 - r;
      } else if (dealing) {
        // cards that don't fit this screen stay in the pile, then sink and fade as the others leave
        const tf = easeInOut(clamp01((p - DEAL_START - 0.05) / (DEAL_END - DEAL_START - 0.05)));
        pose = { ...pile, y: pile.y + tf * 30, s: pile.s * (1 - tf * 0.12) };
        op = 1 - tf;
      } else {
        // after the deal they wait off-stage, exactly like the original carousel
        pose = fan;
        op = 0;
        z = 20 - fan.abs;
      }

      // while dealing the poses follow the timer 1:1; once dealt, the CSS transition returns
      el.style.transition = dealing ? 'none' : '';
      el.style.opacity = String(op);
      el.style.zIndex = String(z);
      el.style.transform = `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rot}deg) scale(${pose.s})`;
    }

    const done = !dealing;
    if (done !== settledRef.current) {
      settledRef.current = done;
      setSettled(done);
    }
  }, []);

  // Re-pose whenever the carousel state or screen size changes.
  useLayoutEffect(() => {
    apply();
  });

  // Auto deal: starts by itself the first time the section is on screen, then stays dealt.
  useEffect(() => {
    if (!autoDeal) {
      live.current.p = 1;
      apply();
      return;
    }
    const el = sectionRef.current;
    let raf = 0;
    let started = live.current.p >= 1;
    let io: IntersectionObserver | undefined;

    const run = () => {
      if (started) return;
      started = true;
      io?.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        live.current.p = clamp01((now - t0) / DEAL_MS);
        apply();
        raf = live.current.p < 1 ? requestAnimationFrame(tick) : 0;
      };
      raf = requestAnimationFrame(tick);
    };

    if (!started) {
      if (el && 'IntersectionObserver' in window) {
        io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && run(), { threshold: 0.35 });
        io.observe(el);
      } else {
        run();
      }
    }
    return () => {
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [autoDeal, apply]);

  return (
    <section
      id="team"
      ref={sectionRef}
      className="relative min-h-screen py-28 px-3 sm:px-6 flex flex-col justify-center"
      aria-label="Team Section"
    >
      <div>
      <div className="crew-panel">
        {/* Title banner sitting on the panel's top edge */}
        <div className="crew-banner">
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, fontSize: compact ? 34 : 56, margin: 0 }}>
            THE CREW!
          </h2>
        </div>

        {/* Card stage */}
        <div
          className={`crew-stage ${settled ? 'is-settled' : 'is-dealing'}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
          }}
          onPointerDown={(e) => {
            dragStart.current = e.clientX;
            didDrag.current = false;
          }}
          onPointerUp={(e) => {
            if (dragStart.current === null) return;
            const dx = e.clientX - dragStart.current;
            dragStart.current = null;
            if (Math.abs(dx) > 40) {
              didDrag.current = true;
              go(dx < 0 ? 1 : -1);
              window.setTimeout(() => (didDrag.current = false), 50);
            }
          }}
        >
          <button className="crew-arrow" disabled={!settled} style={{ left: compact ? -4 : -40 }} onClick={() => go(-1)} aria-label="Previous member">
            <ChevronLeft size={24} />
          </button>
          <button className="crew-arrow" disabled={!settled} style={{ right: compact ? -4 : -40 }} onClick={() => go(1)} aria-label="Next member">
            <ChevronRight size={24} />
          </button>

          {members.map((m, i) => {
            const off = offsets[i];
            const abs = Math.abs(off);
            const visible = abs <= reach;
            const isFlipped = !!flipped[m.id];
            const vColor = VERTICALS[m.verticals[0]]?.color ?? '#8B5CF6';
            const pastel = `color-mix(in srgb, ${m.avatarColor} 42%, white)`;

            return (
              <div
                key={m.id}
                ref={(el) => {
                  slotRefs.current[i] = el;
                }}
                className="crew-slot"
                data-cursor={settled ? 'flip' : undefined}
                // transform / opacity / z-index are written by apply() so dealing never re-renders React
                style={{ pointerEvents: visible && settled ? 'auto' : 'none' }}
                aria-hidden={!visible}
              >
                <div className="crew-lift" onClick={() => toggleFlip(m.id)} role="button" aria-label={`${m.name}: flip card`}>
                  <div className={`crew-flip ${isFlipped ? 'is-flipped' : ''}`}>
                    {/* ============ FRONT ============ */}
                    <div className="crew-face crew-front">
                      {/* coloured art panel */}
                      <div
                        style={{
                          position: 'absolute', left: 7, right: 7, top: 7, height: 236,
                          borderRadius: 10, overflow: 'hidden', background: pastel, border: `2px solid ${NAVY}`,
                        }}
                      >
                        <div style={{ position: 'absolute', left: '50%', top: 26, width: 176, height: 176, marginLeft: -88, borderRadius: '50%', background: 'rgba(255,255,255,0.45)' }} />
                        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 214 }}>
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt={m.name} loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <CartoonAvatar member={m} idx={i} />
                          )}
                        </div>
                      </div>

                      {/* number badge */}
                      <div
                        style={{
                          position: 'absolute', left: 12, top: 12, width: 36, height: 36, borderRadius: '50%',
                          background: vColor, color: '#fff', border: '3px solid #fff', boxShadow: `0 0 0 2px ${NAVY}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: DISPLAY, fontWeight: 900, fontSize: 16,
                        }}
                      >
                        {i + 1}
                      </div>

                      {m.isLead && (
                        <div
                          style={{
                            position: 'absolute', right: 12, top: 14, padding: '2px 9px', borderRadius: 99,
                            background: '#FDE047', color: NAVY, border: `2px solid ${NAVY}`,
                            fontFamily: DISPLAY, fontWeight: 900, fontSize: 10, letterSpacing: 1,
                          }}
                        >
                          LEAD
                        </div>
                      )}

                      {/* slanted name ribbon */}
                      <div
                        style={{
                          position: 'absolute', left: -6, right: -6, top: 214, height: 36,
                          background: NAVY, border: '2px solid #fff', outline: `2px solid ${NAVY}`,
                          transform: 'rotate(-4deg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 10px',
                        }}
                      >
                        <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 17, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.name}
                        </span>
                      </div>

                      {/* little description box */}
                      <div
                        style={{
                          position: 'absolute', left: 14, right: 14, bottom: 11, height: 62,
                          background: '#fff', border: `2px solid ${NAVY}`, borderRadius: 8,
                          padding: '6px 9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <p className="crew-clamp" style={{ margin: 0, textAlign: 'center', fontSize: 11, lineHeight: 1.3, color: NAVY, fontFamily: "'Inter',-apple-system,sans-serif" }}>
                          {m.description}
                        </p>
                      </div>
                    </div>

                    {/* ============ BACK ============ */}
                    <div className="crew-face crew-back">
                      <div style={{ position: 'absolute', inset: 8, border: '2px dashed rgba(255,255,255,0.35)', borderRadius: 10, padding: '14px 12px 10px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 'none', width: 32, height: 32, borderRadius: '50%', background: vColor, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 14 }}>
                            {i + 1}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 15, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                            <div style={{ fontFamily: MONO, fontSize: 9.5, color: '#C4B5FD', lineHeight: 1.25 }}>{m.role}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
                          {m.verticals.map((v) => (
                            <span key={v} style={{ padding: '2px 8px', borderRadius: 5, background: VERTICALS[v].color, border: '2px solid #fff', fontFamily: MONO, fontWeight: 800, fontSize: 9.5 }}>
                              {v}
                            </span>
                          ))}
                        </div>

                        <p style={{ margin: '12px 0 0', fontSize: 11, lineHeight: 1.35, color: '#E6EDF7', fontFamily: "'Inter',-apple-system,sans-serif" }}>
                          <strong style={{ color: '#67E8F9' }}>Builds: </strong>
                          {m.whatIBuild}
                        </p>

                        <div style={{ margin: '10px 0 0', padding: '7px 9px', borderRadius: 8, background: '#fff', color: NAVY, fontSize: 10.5, lineHeight: 1.3, fontFamily: "'Inter',-apple-system,sans-serif" }}>
                          <strong>Fun fact: </strong>
                          {m.funFact}
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: 12 }}>
                          <a className="crew-social" href={m.github} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title="GitHub"><Github size={16} /></a>
                          <a className="crew-social" href={m.linkedin} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title="LinkedIn"><Linkedin size={16} /></a>
                          <a className="crew-social" href={`mailto:${m.email}`} onClick={(e) => e.stopPropagation()} title="Email"><Mail size={16} /></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Caption label under the deck */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <div
            style={{
              background: '#fff', color: NAVY, border: `2px solid ${NAVY}`, padding: '8px 22px',
              fontFamily: DISPLAY, fontWeight: 700, fontSize: compact ? 15 : 19, transform: 'rotate(-1deg)',
              boxShadow: `3px 3px 0 ${NAVY}`,
            }}
          >
            {settled ? 'A card deck of B/Stack builders · click a card to flip it' : 'Dealing the crew…'}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
