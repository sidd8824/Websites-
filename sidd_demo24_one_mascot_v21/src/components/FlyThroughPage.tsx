import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// A scroll-driven "fly-through" scene (open it at /flythrough).
//
// How it works: the page is tall (WRAP_VH), the scene is pinned, and scroll progress p (0..1) drives
// every layer. Each layer grows at its own speed - near layers fast, far layers slow - and that
// difference is the depth. A stone window grows until its hole is bigger than the screen, so you
// fly through it into a second world, where the four verticals appear as cards.
//
// To use your own artwork: replace the <svg> inside any layer (sky1, far, mid, near, inner,
// innerClouds, arch) with an <img src="..." className="w-full h-full object-cover" />.

const WRAP_VH = 520;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);

const CARDS = [
  { t: 'B/Algo', d: 'Competitive programming and problem solving.', c: '#7F77DD' },
  { t: 'B/Uild', d: 'Robots, rovers and hardware that moves.', c: '#1D9E75' },
  { t: 'B/Hack', d: 'Hackathons: build fast, ship faster.', c: '#D85A30' },
  { t: 'B/Dev', d: 'Open source and the web.', c: '#378ADD' },
];

export default function FlyThroughPage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const L = useRef<Record<string, HTMLElement | null>>({});
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reg = (k: string) => (el: HTMLElement | null) => { L.current[k] = el; };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let target = 0, shown = 0, raf = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const read = () => {
      const travel = wrap.offsetHeight - window.innerHeight;
      target = travel > 0 ? clamp(window.scrollY / travel) : 0;
    };
    const put = (k: string, scale: number, opacity: number, y = 0) => {
      const n = L.current[k];
      if (!n) return;
      n.style.transform = `translate3d(0,${y}px,0) scale(${scale.toFixed(4)})`;
      n.style.opacity = opacity.toFixed(3);
    };

    const render = (p: number) => {
      const fly = ease(clamp(p / 0.4));
      const out1 = 1 - ease(clamp((p - 0.22) / 0.16)); // scene 1 dissolves as the window appears
      put('sky1', 1 + fly * 0.25, out1);
      put('far', 1 + fly * 0.6, out1);
      put('mid', 1 + fly * 1.5, out1);
      put('near', 1 + fly * 3.2, out1, fly * 60);

      const title = L.current.title;
      if (title) {
        title.style.opacity = (1 - ease(clamp(p / 0.18))).toFixed(3);
        title.style.transform = `scale(${(1 + fly * 1.1).toFixed(3)})`;
      }

      const in2 = ease(clamp((p - 0.2) / 0.16));
      const pass = ease(clamp((p - 0.3) / 0.42)); // the window grows until the hole fills the screen
      put('inner', 1 + pass * 0.35, in2);
      put('innerClouds', 1 + pass * 0.6, in2);
      put('arch', 0.9 + pass * 12, in2 * (1 - ease(clamp((p - 0.7) / 0.08))));

      const cards = L.current.cards;
      if (cards) cards.style.opacity = ease(clamp((p - 0.72) / 0.2)).toFixed(3);
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const k = ease(clamp((p - 0.72 - i * 0.04) / 0.18));
        card.style.opacity = k.toFixed(3);
        card.style.transform = `translate3d(0,${((1 - k) * 40).toFixed(1)}px,0) scale(${(0.9 + 0.1 * k).toFixed(3)})`;
      });
      const hint = L.current.hint;
      if (hint) hint.style.opacity = (1 - clamp(p * 12)).toFixed(3);
    };

    const loop = () => {
      shown += (target - shown) * (reduce ? 1 : 0.09); // glide toward the scroll position
      if (Math.abs(target - shown) < 0.0002) shown = target;
      render(shown);
      raf = requestAnimationFrame(loop);
    };

    window.scrollTo(0, 0);
    read();
    shown = target;
    loop();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  const layer = 'absolute inset-0 will-change-transform';
  const origin = { transformOrigin: '50% 55%' } as const;
  const svg = 'w-full h-full block';

  return (
    <div ref={wrapRef} className="relative w-full bg-[#0b0a16]" style={{ height: `${WRAP_VH}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0b0a16]">
        {/* SCENE 1: neon dusk */}
        <div ref={reg('sky1')} className={layer} style={{ ...origin, background: 'linear-gradient(180deg,#0a0820 0%,#2b1a66 42%,#8a3f9e 78%,#ff9b6a 100%)' }} />
        <div ref={reg('far')} className={layer} style={origin}>
          <svg className={svg} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
            <g fill="#ffd9f0" opacity=".22"><ellipse cx="300" cy="640" rx="360" ry="46" /><ellipse cx="1200" cy="700" rx="460" ry="54" /><ellipse cx="800" cy="780" rx="520" ry="50" /></g>
            <g fill="#fff">{Array.from({ length: 36 }, (_, i) => <circle key={i} cx={(i * 211) % 1600} cy={(i * 97) % 420} r={1 + (i % 3) * 0.6} opacity={0.35 + (i % 4) * 0.15} />)}</g>
          </svg>
        </div>
        <div ref={reg('mid')} className={layer} style={origin}>
          <svg className={svg} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
            <g fill="#1a1240"><path d="M180 430h300l-40 70q-110 70-220 0z" /><path d="M1090 330h360l-50 90q-130 90-260 0z" /></g>
            <g stroke="#67E8F9" strokeWidth="3" fill="none" opacity=".8"><path d="M215 440h60v-30h50M1130 340h70v-30h60v30h60" /></g>
            <g fill="#67E8F9"><circle cx="325" cy="410" r="6" /><circle cx="1320" cy="340" r="6" /></g>
          </svg>
        </div>
        <div ref={reg('near')} className={layer} style={origin}>
          <svg className={svg} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
            <path fill="#120c2a" d="M1000 900V610q60-30 130-10l60-60q70-20 130 20 40-20 120 0v340z" />
            <g fill="#07050f"><rect x="1250" y="470" width="14" height="80" rx="6" /><circle cx="1257" cy="462" r="13" /></g>
          </svg>
        </div>
        <div ref={reg('title')} className="absolute left-0 right-0 top-[34%] text-center will-change-transform">
          <h1 className="m-0 text-[#F4EEFF] font-black tracking-[0.04em] text-[clamp(54px,12vw,170px)] leading-none" style={{ fontFamily: 'Georgia, serif', textShadow: '0 8px 60px rgba(0,0,0,.5)' }}>B/Stack</h1>
          <p className="mt-3 font-mono text-xs tracking-[0.35em] uppercase text-white/80">scroll to fly in</p>
        </div>

        {/* SCENE 2: the world behind the window */}
        <div ref={reg('inner')} className={layer} style={{ ...origin, background: 'linear-gradient(180deg,#14305e 0%,#3a56b8 45%,#67E8F9 100%)' }} />
        <div ref={reg('innerClouds')} className={layer} style={origin}>
          <svg className={svg} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
            <g fill="#fff" opacity=".25"><ellipse cx="400" cy="520" rx="420" ry="60" /><ellipse cx="1150" cy="600" rx="520" ry="70" /><ellipse cx="800" cy="720" rx="640" ry="64" /></g>
            <circle cx="800" cy="500" r="90" fill="#e9fbff" opacity=".85" />
          </svg>
        </div>

        {/* the stone window */}
        <div ref={reg('arch')} className={layer} style={origin}>
          <svg className={svg} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs><linearGradient id="ft-stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a3f86" /><stop offset="1" stopColor="#1a1438" /></linearGradient></defs>
            <path fill="url(#ft-stone)" fillRule="evenodd" d="M0 0H100V100H0Z M50 50m-24 0a24 24 0 1 0 48 0a24 24 0 1 0-48 0Z" />
            <circle cx="50" cy="50" r="24" fill="none" stroke="#67E8F9" strokeWidth=".6" />
            <circle cx="50" cy="50" r="27" fill="none" stroke="#67E8F9" strokeWidth=".25" opacity=".6" />
          </svg>
        </div>

        {/* the four verticals */}
        <div ref={reg('cards')} className="absolute inset-0 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-[2vw] px-[4vw] opacity-0">
          {CARDS.map((c, i) => (
            <div
              key={c.t}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="text-center rounded-2xl w-[78vw] sm:w-[20vw] sm:max-w-[250px] p-4 sm:p-5 will-change-transform"
              style={{ opacity: 0, background: 'rgba(14,10,30,.75)', border: `2px solid ${c.c}`, boxShadow: `0 0 0 4px ${c.c}33, 0 20px 60px rgba(0,0,0,.5)` }}
            >
              <h3 className="m-0 mb-2 font-black text-xl sm:text-2xl" style={{ color: c.c }}>{c.t}</h3>
              <p className="m-0 font-mono text-xs leading-relaxed text-[#E6EDF7]/85">{c.d}</p>
            </div>
          ))}
        </div>

        <Link to="/" className="absolute top-5 left-5 z-10 font-mono text-[11px] tracking-[0.25em] uppercase text-white/80 hover:text-white">← back to site</Link>
        <div ref={reg('hint')} className="absolute left-0 right-0 bottom-6 text-center font-mono text-[11px] tracking-[0.3em] uppercase text-white/70">Scroll</div>
      </div>
    </div>
  );
}
