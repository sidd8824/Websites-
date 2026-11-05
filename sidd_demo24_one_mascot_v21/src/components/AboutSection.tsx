import { useEffect, useState, useRef } from 'react';
import { CLUB_META } from '../data/club';

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Counter states that flicker through numbers then settle
  const [counts, setCounts] = useState({
    members: '12',
    projects: '08',
    events: '05',
    verticals: '2',
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Flickering number effect
  useEffect(() => {
    if (!inView) return;

    let frames = 0;
    const maxFrames = 22;
    const interval = setInterval(() => {
      frames++;
      if (frames < maxFrames) {
        setCounts({
          members: `${Math.floor(Math.random() * 80 + 30)}+`,
          projects: `${Math.floor(Math.random() * 30 + 10)}+`,
          events: `${Math.floor(Math.random() * 20 + 5)}+`,
          verticals: `${Math.floor(Math.random() * 6 + 1)}`,
        });
      } else {
        setCounts({
          members: '140+',
          projects: '42+',
          events: '28+',
          verticals: '4',
        });
        clearInterval(interval);
      }
    }, 70);

    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative min-h-screen py-32 overflow-hidden flex flex-col justify-center select-none"
      aria-label="About B/Stack Section"
      data-cursor="pencil"
    >
      {/* Corner raw crosshair marks */}
      <div className="absolute top-12 left-8 font-mono text-xs text-[#A7A3C7]/40 pointer-events-none select-none">
        + 01.ABOUT // 45.32°N
      </div>
      <div className="hidden sm:block absolute top-12 right-8 font-mono text-xs text-[#A7A3C7]/40 pointer-events-none select-none">
        [BOSSCODER TECH] +
      </div>
      <div className="absolute bottom-12 left-8 font-mono text-xs text-[#A7A3C7]/40 pointer-events-none select-none">
        + CLUSTER: 04 VERTICALS
      </div>
      <div className="hidden sm:block absolute bottom-12 right-8 font-mono text-xs text-[#A7A3C7]/40 pointer-events-none select-none">
        + SYS_READY
      </div>

      {/* Giant outlined ghost word "ABOUT" bleeding off the left edge */}
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.05] z-0">
        <span
          className="font-display font-black text-[18vw] leading-none text-transparent"
          style={{ WebkitTextStroke: '3px #E6EDF7' }}
        >
          ABOUT
        </span>
      </div>

      {/* Rotated vertical line: "the tech club of Bosscoder School of Technology" */}
      <div className="hidden lg:block absolute left-8 top-1/3 -rotate-90 origin-left font-mono text-xs tracking-widest text-[#A7A3C7]/70 uppercase pointer-events-none">
        — The tech club of Bosscoder School of Technology
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Anti-design broken collage statement */}
        <div className="relative max-w-4xl mx-auto my-12">
          {/* "we are student" */}
          <div
            className={`inline-block font-mono text-sm sm:text-base md:text-lg text-[#A7A3C7] uppercase tracking-wider transform -rotate-3 transition-all duration-700 ${
              inView ? 'translate-y-0 opacity-100 rotate-[-3deg]' : '-translate-y-8 opacity-0 rotate-0'
            }`}
          >
            we are student
          </div>

          {/* "BUILDERS" with scribbled doodle loop around it */}
          <div className="relative my-2">
            <h2
              className={`font-display font-black text-[14vw] sm:text-8xl lg:text-9xl text-[#E6EDF7] tracking-tight transform transition-all duration-700 ${
                inView ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
              }`}
            >
              BUILDERS
            </h2>

            {/* Hand-drawn scribbled loop SVG around BUILDERS */}
            <svg
              className="wobble-doodle absolute -inset-x-4 -inset-y-3 w-[108%] h-[120%] pointer-events-none text-[#67E8F9]"
              viewBox="0 0 600 160"
              fill="none"
            >
              <path
                d="M 20 80 C 15 25, 200 15, 450 20 C 580 25, 600 70, 560 120 C 510 160, 250 155, 60 140 C 10 135, 10 60, 140 40 C 260 20, 500 30, 570 70"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="1800"
                strokeDashoffset={inView ? '0' : '1800'}
                style={{ transition: 'stroke-dashoffset 1.8s ease-out' }}
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* "MAKE" / "BREAK" / "SHIP." row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-8 mt-6">
            {/* MAKE (teal) with wavy underline */}
            <div className="relative inline-block transform -rotate-2">
              <span className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-[#5DCAA5]">
                MAKE
              </span>
              {/* Wavy underline */}
              <svg
                className="wobble-doodle absolute -bottom-3 left-0 w-full h-4 text-[#5DCAA5]"
                viewBox="0 0 160 20"
                fill="none"
              >
                <path
                  d="M 5 10 Q 25 2, 45 10 T 85 10 T 125 10 T 155 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="300"
                  strokeDashoffset={inView ? '0' : '300'}
                  style={{ transition: 'stroke-dashoffset 1.2s ease-out 0.4s' }}
                />
              </svg>
            </div>

            {/* BREAK (crossed out, coral) with crack lines above */}
            <div className="relative inline-block transform rotate-3">
              {/* Crack lines doodle */}
              <svg
                className="wobble-doodle absolute -top-5 left-1/3 w-12 h-6 text-[#F0997B]"
                viewBox="0 0 50 24"
                fill="none"
              >
                <path
                  d="M 5 20 L 20 5 L 30 18 L 45 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="relative font-display font-black text-4xl sm:text-6xl md:text-7xl text-[#F0997B]">
                BREAK
                <span className="absolute left-0 right-0 top-1/2 h-[4px] bg-[#E6EDF7] transform -rotate-6" />
              </span>
            </div>

            {/* SHIP. (huge, blue, running off edge) */}
            <div className="inline-block transform -rotate-1">
              <span className="font-display font-black text-5xl sm:text-7xl md:text-8xl text-[#85B7EB]">
                SHIP.
              </span>
            </div>

            {/* Doodled laptop with code brackets */}
            <div className="inline-block ml-auto transform rotate-6">
              <svg className="wobble-doodle w-14 h-14 text-[#E6EDF7]/70" viewBox="0 0 64 64" fill="none">
                <rect x="12" y="16" width="40" height="26" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M 6 46 L 58 46 L 52 50 L 12 50 Z" stroke="currentColor" strokeWidth="2" />
                <path d="M 24 26 L 20 29 L 24 32" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" />
                <path d="M 40 26 L 44 29 L 40 32" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" />
                <line x1="30" y1="34" x2="34" y2="24" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Doodled rocket with smoke trail & sparkles */}
          <div className="absolute -top-16 right-0 sm:right-12 hidden sm:block pointer-events-none">
            <svg className="wobble-doodle w-20 h-20 text-[#D85A30]" viewBox="0 0 80 80" fill="none">
              <path
                d="M 45 15 C 45 15, 65 25, 68 45 C 60 48, 55 50, 50 56 L 38 44 C 42 38, 44 32, 45 15 Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M 32 50 L 22 56 L 26 44" stroke="currentColor" strokeWidth="2" />
              <path d="M 52 68 L 56 78 L 44 74" stroke="currentColor" strokeWidth="2" />
              <path
                d="M 30 60 C 20 70, 10 72, 5 75"
                stroke="#67E8F9"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            </svg>
          </div>
        </div>

        {/* Four Staggered Counters set at different heights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mt-20 pt-8 border-t border-white/10 relative">
          {/* Counter 1: Members */}
          <div className="glass glow-violet p-4 sm:p-5 rounded-2xl transform -rotate-2 hover:rotate-0 self-start">
            <div className="font-display font-black text-3xl sm:text-5xl text-[#A78BFA] [text-shadow:0_0_22px_rgba(139,92,246,0.65)]">
              {counts.members}
            </div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#E6EDF7] mt-1">
              members
            </div>
            <div className="text-[11px] text-[#A7A3C7] font-mono mt-2">
              across computer science & engineering
            </div>
          </div>

          {/* Counter 2: Projects (Staggered lower) */}
          <div className="glass glow-green p-4 sm:p-5 rounded-2xl transform rotate-3 hover:rotate-0 md:mt-8 self-center">
            <div className="font-display font-black text-3xl sm:text-5xl text-[#3DDBA6] [text-shadow:0_0_22px_rgba(29,158,117,0.65)]">
              {counts.projects}
            </div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#E6EDF7] mt-1">
              projects built
            </div>
            <div className="text-[11px] text-[#A7A3C7] font-mono mt-2">
              rovers, compilers, IoT & OSS
            </div>
          </div>

          {/* Counter 3: Events */}
          <div className="glass glow-coral p-4 sm:p-5 rounded-2xl transform -rotate-1 hover:rotate-0 self-start">
            <div className="font-display font-black text-3xl sm:text-5xl text-[#FF8F63] [text-shadow:0_0_22px_rgba(232,87,42,0.65)]">
              {counts.events}
            </div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#E6EDF7] mt-1">
              events & jams
            </div>
            <div className="text-[11px] text-[#A7A3C7] font-mono mt-2">
              hackathons, workshops & battles
            </div>
          </div>

          {/* Counter 4: Verticals with doodled circle around "4" */}
          <div className="glass glow-blue p-4 sm:p-5 rounded-2xl transform rotate-2 hover:rotate-0 md:mt-12 self-end relative">
            <div className="relative inline-block font-display font-black text-3xl sm:text-5xl text-[#63B0FF] [text-shadow:0_0_22px_rgba(55,138,221,0.65)]">
              {counts.verticals}
              {/* Doodled circle around 4 */}
              <svg
                className="wobble-doodle absolute -inset-2 w-14 h-14 text-[#D85A30] pointer-events-none"
                viewBox="0 0 60 60"
                fill="none"
              >
                <circle
                  cx="30"
                  cy="30"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="200"
                  strokeDashoffset={inView ? '0' : '200'}
                  style={{ transition: 'stroke-dashoffset 1.4s ease-out 0.6s' }}
                />
              </svg>
            </div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#E6EDF7] mt-1">
              verticals
            </div>
            <div className="text-[11px] text-[#A7A3C7] font-mono mt-2">
              Algo · Uild · Hack · Dev
            </div>
          </div>

          {/* Hand-drawn arrow with "that's us" note */}
          <div className="hidden lg:flex items-center gap-2 absolute -top-12 right-20 text-[#67E8F9]">
            <span className="font-mono text-xs font-bold">that&apos;s us!</span>
            <svg className="wobble-doodle w-12 h-8" viewBox="0 0 60 30" fill="none">
              <path
                d="M 5 5 Q 30 8, 48 24 M 36 24 L 50 25 L 48 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Small EST. 20XX sticker + tilted floating mini stack of four colored layers */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl glass glow-cyan">
            <span className="font-mono text-xs text-[#A7A3C7]">Founded at</span>
            <span className="font-mono text-xs font-bold text-[#E6EDF7]">{CLUB_META.institution}</span>
            <span className="px-2 py-0.5 rounded bg-[#67E8F9] text-[#0B0A16] font-mono text-[10px] font-black">
              {CLUB_META.established}
            </span>
          </div>

          {/* Floating mini stack of 4 colored layers */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#A7A3C7] mr-2">Core Layers:</span>
            <div className="flex -space-x-1.5">
              <span className="w-6 h-6 rounded-md bg-[#8B5CF6] border border-white/30 shadow-[0_0_14px_rgba(139,92,246,0.7)] transform -rotate-6" title="B/Algo" />
              <span className="w-6 h-6 rounded-md bg-[#1D9E75] border border-white/30 shadow-[0_0_14px_rgba(29,158,117,0.7)] transform -rotate-3" title="B/Uild" />
              <span className="w-6 h-6 rounded-md bg-[#D85A30] border border-white/30 shadow-[0_0_14px_rgba(216,90,48,0.7)] transform rotate-3" title="B/Hack" />
              <span className="w-6 h-6 rounded-md bg-[#378ADD] border border-white/30 shadow-[0_0_14px_rgba(55,138,221,0.7)] transform rotate-6" title="B/Dev" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
