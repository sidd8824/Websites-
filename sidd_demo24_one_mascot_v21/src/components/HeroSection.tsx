import { useEffect, useState } from 'react';

interface HeroSectionProps {
  onNavigate: (sectionId: string) => void;
}

// Terminal-style wordmark: the name types itself in at a prompt, then the tagline follows.
const WORD = 'B/Stack';
const TAGLINE = '> the tech club of Bosscoder';

export default function HeroSection(_props: HeroSectionProps) {
  const [typed, setTyped] = useState(0);
  const [tagTyped, setTagTyped] = useState(0);

  // Type the wordmark in once on load (instantly for reduced-motion users)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(WORD.length);
      setTagTyped(TAGLINE.length);
      return;
    }
    let i = 0;
    let j = 0;
    let iv1: number | undefined;
    let iv2: number | undefined;
    const start = window.setTimeout(() => {
      iv1 = window.setInterval(() => {
        i += 1;
        setTyped(i);
        if (i >= WORD.length) {
          window.clearInterval(iv1);
          iv2 = window.setInterval(() => {
            j += 1;
            setTagTyped(j);
            if (j >= TAGLINE.length) window.clearInterval(iv2);
          }, 35);
        }
      }, 170);
    }, 500);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(iv1);
      window.clearInterval(iv2);
    };
  }, []);

  return (
    <div
      id="home"
      className="relative w-full h-screen overflow-hidden flex flex-col justify-between hero-gradient-stage"
      aria-label="B/Stack Hero"
    >
      {/* Dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(3,2,10,0.7) 100%)',
          // fade the vignette out toward the bottom so it never ends in a hard edge against About
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Main hero content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col items-center justify-center text-center pointer-events-none">
        {/* B/Stack WORDMARK as a terminal prompt that types itself in */}
        <div className="w-full flex flex-col items-center justify-center my-4 origin-center pointer-events-none">
          <h1
            aria-label="B/Stack"
            className="font-mono font-bold text-4xl min-[400px]:text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] leading-none select-none text-[#F6EEDB] text-left whitespace-nowrap"
            style={{ width: '10ch', textShadow: '0 2px 28px rgba(5, 3, 8, 0.9)' }}
          >
            <span aria-hidden="true" className="text-[#67E8F9]">
              ${' '}
            </span>
            <span aria-hidden="true">
              {WORD.slice(0, typed)
                .split('')
                .map((char, idx) => (
                  <span key={idx} className={char === '/' ? 'text-[#E8572A]' : ''}>
                    {char}
                  </span>
                ))}
            </span>
            <span
              aria-hidden="true"
              className="term-cursor inline-block bg-[#E8572A] align-baseline"
              style={{ width: '0.5em', height: '0.85em', marginLeft: '0.08em', verticalAlign: '-0.06em' }}
            />
          </h1>
          <p
            aria-hidden="true"
            className="font-mono text-sm sm:text-base md:text-lg text-[#A7A3C7] mt-5 min-h-[1.6em]"
            style={{ textShadow: '0 1px 14px rgba(5, 3, 8, 0.9)' }}
          >
            {TAGLINE.slice(0, tagTyped)}
          </p>
        </div>
      </div>
    </div>
  );
}
