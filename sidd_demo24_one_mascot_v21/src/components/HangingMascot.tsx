import { useEffect, useRef } from 'react';

/**
 * Hand-drawn builder hanging from a crane cable. Stays pinned in the middle of the
 * Projects reel while the cards scroll past. It swings like a pendulum, twists a
 * little around the cable, gets pushed by the cursor and gets a nudge whenever the
 * project changes. Hoodie takes the colour of the active project's vertical.
 */
const L = 250; // cable length in svg units (bigger = hangs lower)
const INK = '#E6EDF7';

interface Props {
  color: string;
  /** change this (e.g. the active project index) to give the gondola a nudge */
  kick: number;
}

export default function HangingMascot({ color, kick }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const swingRef = useRef<HTMLDivElement>(null);
  const phys = useRef({ th: 0, w: 0, yaw: 0, cx: 0, last: kick });

  // nudge when the project changes
  useEffect(() => {
    const s = phys.current;
    if (kick !== s.last) {
      s.w += (kick > s.last ? 1 : -1) * 0.55;
      s.last = kick;
    }
  }, [kick]);

  useEffect(() => {
    const el = swingRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const s = phys.current;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let vis = true;

    const onMove = (e: PointerEvent) => {
      s.cx = e.clientX / window.innerWidth - 0.5; // -0.5 .. 0.5
      s.w += Math.max(-40, Math.min(40, e.movementX || 0)) * 0.0011; // cursor "pushes" it
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const io = new IntersectionObserver((en) => { vis = en[0].isIntersecting; });
    if (rootRef.current) io.observe(rootRef.current);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!vis || document.hidden) return;
      t += dt;
      // pendulum: spring toward (idle sway + lean toward the cursor), light damping
      const target = Math.sin(t * 0.85) * 0.045 + Math.sin(t * 0.37 + 1) * 0.02 + s.cx * 0.16;
      s.w += (-7 * (s.th - target) - 0.9 * s.w) * dt;
      s.th += s.w * dt;
      // slow twist around the cable, a bit more when it is swinging
      const yawT = Math.sin(t * 0.55) * 0.3 + s.cx * 0.35 + s.w * 0.5;
      s.yaw += (yawT - s.yaw) * Math.min(1, dt * 3);
      el.style.transform = `perspective(900px) rotateY(${s.yaw}rad) rotateZ(${s.th}rad)`;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  const tint: React.CSSProperties = { fill: color, fillOpacity: 0.55, transition: 'fill .6s' };

  return (
    <div ref={rootRef} className="absolute inset-x-0 top-0 flex justify-center pointer-events-none z-[1]" aria-hidden="true">
      <div
        ref={swingRef}
        className="w-[120px] sm:w-[190px] will-change-transform"
        style={{ transformOrigin: '50% 0', opacity: 0.8 }}
      >
        <svg viewBox={`0 0 300 ${L + 290}`} className="w-full h-auto block overflow-visible">
          <defs>
            <filter id="bs-rough" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
              <feDisplacementMap in="SourceGraphic" scale="3.2" />
            </filter>
          </defs>
          <g filter="url(#bs-rough)">
            {/* cable (from the top of the stage) */}
            <line x1="150" y1="0" x2="150" y2={L + 22} stroke={INK} strokeWidth="3" strokeLinecap="round" />
            <g transform={`translate(0 ${L})`}>
              <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="150" cy="32" r="10" fill="#0B0A16" />
                <path d="M150 42 q0 14 -10 14 q-10 0 -6 -10" strokeWidth="4" />
                <path d="M150 44 L50 168 M150 44 L250 168 M150 44 L100 168 M150 44 L200 168" />
              </g>
              {/* character, behind the rails */}
              <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
                <rect x="124" y="228" width="22" height="42" rx="6" fill="#2a2650" />
                <rect x="154" y="228" width="22" height="42" rx="6" fill="#2a2650" />
                <ellipse cx="132" cy="272" rx="16" ry="7" fill="#3b3f5c" />
                <ellipse cx="168" cy="272" rx="16" ry="7" fill="#3b3f5c" />
                <rect x="110" y="128" width="80" height="110" rx="30" style={tint} />
                <circle cx="150" cy="98" r="38" style={tint} />
                <ellipse cx="150" cy="104" rx="24" ry="26" fill="#0B0A16" />
              </g>
              <g stroke="#9fb4c9" strokeWidth="3" fill="none">
                <rect x="133" y="98" width="15" height="11" rx="3" />
                <rect x="153" y="98" width="15" height="11" rx="3" />
                <line x1="148" y1="103" x2="153" y2="103" />
              </g>
              <path d="M140 120 Q150 127 160 120" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M140 134 L137 156 M160 134 L163 156" stroke={INK} strokeWidth="2.5" />
              {/* gondola rails */}
              <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
                <rect x="50" y="168" width="200" height="92" rx="3" fill="rgba(11,10,22,.18)" />
                <line x1="50" y1="212" x2="250" y2="212" />
                <line x1="100" y1="168" x2="100" y2="260" />
                <line x1="200" y1="168" x2="200" y2="260" />
                <rect x="38" y="260" width="224" height="20" rx="3" fill="#1b1838" />
                <path d="M52 270 h20 M92 270 h20 M132 270 h20 M172 270 h20 M212 270 h20" strokeOpacity=".6" />
              </g>
              {/* laptop + hands in front */}
              <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
                <rect x="118" y="176" width="64" height="42" rx="5" fill="#0B0A16" />
                <text x="150" y="203" textAnchor="middle" fontFamily="'Fira Code', ui-monospace, monospace" fontWeight="700" fontSize="17" fill="#7f95b8" stroke="none">{'</>'}</text>
              </g>
              <circle cx="114" cy="214" r="8" fill="#F4C9A8" stroke={INK} strokeWidth="2.5" />
              <circle cx="186" cy="212" r="8" fill="#F4C9A8" stroke={INK} strokeWidth="2.5" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
