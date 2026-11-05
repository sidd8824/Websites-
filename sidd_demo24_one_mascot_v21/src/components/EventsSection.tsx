import { glowStyle } from '../utils/glow';
import React, { useState, useEffect, useRef, useId } from 'react';
import { EVENTS, ClubEvent } from '../data/club';
import {
  categorizeEvents,
  computeCountdown,
  createTrailParticle,
  TrailParticle,
  type CountdownResult,
} from '../utils/clubUtils';
import {
  Calendar,
  MapPin,
  Sparkles,
  X,
  ArrowUpRight,
  CheckCircle2,
  QrCode,
  Rocket,
  Compass,
  Clock,
  Scissors,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { scrollToY, docTop } from '../utils/scroll';
import FlightCalendar from './FlightCalendar';

interface EventsSectionProps {
  onNavigate: (sectionId: string) => void;
}

// Hourglass countdown: sand level shows how close the event is (30-day window), digits sit beside it.
const HOURGLASS_WINDOW_S = 30 * 86400;
const GLASS_PATH =
  'M60 10 H140 V30 Q140 70 104 100 Q140 130 140 170 V190 H60 V170 Q60 130 96 100 Q60 70 60 30 Z';

function HourglassCountdown({ countdown, urgent }: { countdown: CountdownResult; urgent: boolean }) {
  const uid = useId().replace(/:/g, '');
  const [spin, setSpin] = useState(false);
  const f = Math.min(1, Math.max(0, countdown.totalSeconds / HOURGLASS_WINDOW_S));
  const topH = 90 * f;
  const botH = 90 * (1 - f);
  const sand = urgent ? '#E8572A' : '#F2C14E';

  const spinGlass = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (spin) return;
    setSpin(true);
    setTimeout(() => setSpin(false), 950);
  };

  return (
    <div
      className={`flex items-center gap-5 sm:gap-7 ${urgent ? 'animate-urgent-blink' : ''}`}
      role="timer"
      aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds left`}
    >
      <button
        type="button"
        onClick={spinGlass}
        aria-label="Spin the hourglass"
        className="shrink-0 cursor-pointer bg-transparent border-0 p-0"
        data-cursor="rocket"
      >
        <svg
          viewBox="0 0 200 200"
          className="w-24 h-24 sm:w-28 sm:h-28 overflow-visible"
          style={{
            transform: spin ? 'rotate(360deg)' : 'rotate(0deg)',
            transition: spin ? 'transform 0.9s cubic-bezier(0.5, 0, 0.2, 1)' : 'none',
          }}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={`gc-${uid}`}>
              <path d={GLASS_PATH} />
            </clipPath>
          </defs>
          <rect x="50" y={100 - topH} width="100" height={topH} fill={sand} clipPath={`url(#gc-${uid})`} />
          <rect x="50" y={190 - botH} width="100" height={botH} fill={sand} clipPath={`url(#gc-${uid})`} />
          {countdown.totalSeconds > 0 && (
            <line x1="100" y1="100" x2="100" y2={190 - botH} stroke={sand} strokeWidth="2" className="hg-stream" />
          )}
          <path d={GLASS_PATH} fill="none" stroke="#E6EDF7" strokeWidth="3" strokeLinejoin="round" />
          <line x1="52" y1="10" x2="148" y2="10" stroke="#E8572A" strokeWidth="6" strokeLinecap="round" />
          <line x1="52" y1="190" x2="148" y2="190" stroke="#E8572A" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </button>

      <div className="font-mono font-black text-xl sm:text-2xl leading-snug select-none">
        <div>
          <span className="text-[#67E8F9]">{countdown.dd}</span>{' '}
          <span className="text-xs font-bold text-[#A7A3C7] uppercase tracking-wider">days</span>
        </div>
        <div>
          <span className="text-[#E6EDF7]">{countdown.hh}</span>{' '}
          <span className="text-xs font-bold text-[#A7A3C7] uppercase tracking-wider">hrs</span>
        </div>
        <div>
          <span className="text-[#E6EDF7]">{countdown.mm}</span>{' '}
          <span className="text-xs font-bold text-[#A7A3C7] uppercase tracking-wider">min</span>
        </div>
        <div>
          <span key={countdown.ss} className="inline-block animate-flip-digit text-[#E8572A]">
            {countdown.ss}
          </span>{' '}
          <span className="text-xs font-bold text-[#A7A3C7] uppercase tracking-wider">sec</span>
        </div>
      </div>
    </div>
  );
}

// Small live countdown chip shown on every "Coming up" card.
function CountdownChip({ cd }: { cd: CountdownResult }) {
  const urgent = !cd.isLive && cd.totalSeconds > 0 && cd.totalSeconds < 3600;
  let text: string;
  if (cd.isLive) text = 'LIVE NOW';
  else if (cd.days > 0) text = `${cd.days}d ${cd.hh}h ${cd.mm}m`;
  else if (urgent) text = `${cd.mm}:${cd.ss}`;
  else text = `${cd.hh}:${cd.mm}:${cd.ss}`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-chip font-mono text-[11px] font-bold tabular-nums ${
        cd.isLive || urgent ? 'text-[#E8572A]' : 'text-[#67E8F9]'
      }`}
      title="Time until this event starts"
    >
      <span className="relative flex w-2 h-2">
        <span
          className={`absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping ${
            cd.isLive || urgent ? 'bg-[#E8572A]' : 'bg-[#67E8F9]'
          }`}
        />
        <span
          className={`relative inline-flex w-2 h-2 rounded-full ${cd.isLive || urgent ? 'bg-[#E8572A]' : 'bg-[#67E8F9]'}`}
        />
      </span>
      <span>{cd.isLive ? text : `in ${text}`}</span>
    </span>
  );
}

// Reveals an element the first time it scrolls into view (used to stagger cards in).
function useReveal<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

export default function EventsSection(_props: EventsSectionProps) {
  // Automatically categorize nearest upcoming event as hero next mission
  const { heroEvent, upcomingEvents, completedEvents } = categorizeEvents(EVENTS);

  // Live countdown state
  const [countdown, setCountdown] = useState(() => computeCountdown(heroEvent.targetIso));
  const [ticketTorn, setTicketTorn] = useState(false);
  const [stubRegistered, setStubRegistered] = useState(false);
  const [selectedEventModal, setSelectedEventModal] = useState<ClubEvent | null>(null);

  // Sign up form inside torn ticket details
  const [signupForm, setSignupForm] = useState({
    name: '',
    branch: 'Computer Science & Engineering',
    year: '2nd Year',
  });
  const [signupSubmitted, setSignupSubmitted] = useState(false);

  // Hero ticket hover (values are written straight to CSS variables, so mouse moves never re-render)
  const ticketRef = useRef<HTMLDivElement>(null);

  // Optional soft tick sound / haptic every second (off by default)
  const [tickSound, setTickSound] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  // Cursor Time Trail state (desktop only)
  const sectionRef = useRef<HTMLElement>(null);
  const [particles, setParticles] = useState<TrailParticle[]>([]);
  const lastSpawnTime = useRef(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // SVG drawing in-view trigger
  const [inView, setInView] = useState(false);
  const [upRef, upShown] = useReveal<HTMLDivElement>();
  const [doneRef, doneShown] = useReveal<HTMLDivElement>();

  // Detect desktop and prefers-reduced-motion
  useEffect(() => {
    const mediaTouch = window.matchMedia('(hover: hover) and (pointer: fine)');
    const mediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    setIsDesktop(mediaTouch.matches);
    setReducedMotion(mediaMotion.matches);

    const onMediaChange = () => {
      setIsDesktop(mediaTouch.matches);
      setReducedMotion(mediaMotion.matches);
    };

    mediaTouch.addEventListener('change', onMediaChange);
    mediaMotion.addEventListener('change', onMediaChange);
    return () => {
      mediaTouch.removeEventListener('change', onMediaChange);
      mediaMotion.removeEventListener('change', onMediaChange);
    };
  }, []);

  // Countdown timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(computeCountdown(heroEvent.targetIso));
    }, 1000);
    return () => clearInterval(timer);
  }, [heroEvent.targetIso]);

  // Last hour before the hero event: ticket glows orange, shakes and the countdown flashes
  const urgent = !countdown.isLive && countdown.totalSeconds > 0 && countdown.totalSeconds < 3600;

  // Optional soft tick (and a tiny haptic buzz on phones) each second
  useEffect(() => {
    if (!tickSound || countdown.isLive || countdown.totalSeconds <= 0) return;
    try {
      const ctx = audioRef.current;
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = countdown.totalSeconds % 2 ? 1500 : 1000;
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.05, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.06);
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8);
    } catch {
      /* audio is optional */
    }
  }, [countdown.totalSeconds, tickSound, countdown.isLive]);

  const toggleTickSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !tickSound;
    if (next) {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx && !audioRef.current) audioRef.current = new Ctx();
        audioRef.current?.resume();
      } catch {
        /* ignore */
      }
    }
    setTickSound(next);
  };

  // Clean expired cursor trail particles
  useEffect(() => {
    if (!isDesktop || reducedMotion) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setParticles((prev) => prev.filter((p) => now - p.createdAt < 1000));
    }, 80);
    return () => clearInterval(interval);
  }, [isDesktop, reducedMotion]);

  // Viewport intersection for doodle self-drawing with stroke-dashoffset
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Cursor trail move handler
  const handleSectionMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!isDesktop || reducedMotion) return;
    // keep the ticket clean: no trail doodles while the cursor is over it
    if (ticketRef.current?.contains(e.target as Node)) return;

    const now = Date.now();
    if (now - lastSpawnTime.current < 45) return; // throttle 45ms
    lastSpawnTime.current = now;

    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    setParticles((prev) => {
      const alive = prev.filter((p) => now - p.createdAt < 1000);
      if (alive.length >= 20) return alive; // max 20 alive
      return [...alive, createTrailParticle(relX, relY, Math.random(), now)];
    });
  };

  // Gentle ticket hover: max ~4deg tilt, moving light, and inner layers drifting at different depths.
  const handleTicketMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop || reducedMotion) return;
    const el = ticketRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    const clamp = (n: number) => Math.max(-1, Math.min(1, n));
    const nx = clamp((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2));
    const ny = clamp((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2));

    el.style.setProperty('--rx', String(-ny * 3.5));
    el.style.setProperty('--ry', String(nx * 4));
    el.style.setProperty('--px', String(nx));
    el.style.setProperty('--py', String(ny));
    el.style.setProperty('--sx', String((nx + 1) * 50));
    el.style.setProperty('--sy', String((ny + 1) * 50));
    el.style.setProperty('--hv', '1');
  };

  const handleTicketMouseLeave = () => {
    const el = ticketRef.current;
    if (!el) return;
    ['--rx', '--ry', '--px', '--py'].forEach((k) => el.style.setProperty(k, '0'));
    el.style.setProperty('--sx', '50');
    el.style.setProperty('--sy', '50');
    el.style.setProperty('--hv', '0');
  };

  // Depth layer: shifts a few px against the card so the ticket feels 3D without bending
  const layer = (depth: number): React.CSSProperties =>
    isDesktop && !reducedMotion
      ? {
          transform: `translate(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth}px))`,
          transition: 'transform 0.25s ease-out',
        }
      : {};

  // Register stub button click
  const handleStubRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStubRegistered(true);

    confetti({
      particleCount: 75,
      spread: 65,
      origin: { y: 0.65 },
      colors: ['#67E8F9', '#E8572A', '#1D9E75', '#378ADD'],
    });
  };

  // Submit short sign-up inside torn ticket details
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name.trim()) return;

    setSignupSubmitted(true);
    setStubRegistered(true);

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#67E8F9', '#E8572A', '#378ADD', '#F3EFE6'],
    });
  };

  return (
    <section
      id="events"
      ref={sectionRef}
      onMouseMove={handleSectionMouseMove}
      className="relative min-h-screen scroll-mt-28 py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-center select-none overflow-visible"
      aria-label="Events Section"
    >
      {/* 7.1 CURSOR TIME TRAIL PARTICLES OVER EVENTS SECTION (Desktop Only) */}
      {isDesktop && !reducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30" aria-hidden="true">
          {particles.map((p) => {
            const age = Math.min(1, Math.max(0, (Date.now() - p.createdAt) / 1000));
            const opacity = Math.max(0, 1 - age);
            const translateY = -48 * age;
            const translateX = p.driftX * age;
            const scale = 0.85 + 0.35 * age;
            const rotation = p.rotation * age;

            return (
              <div
                key={p.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-transform"
                style={{
                  left: p.x,
                  top: p.y,
                  opacity,
                  transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}) rotate(${rotation}deg)`,
                  transition: 'opacity 0.08s linear',
                }}
              >
                {/* 1. Hand-drawn clock with fast-spinning minute hand */}
                {p.type === 'clock' && (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 20 20"
                    className="overflow-visible drop-shadow-sm wobble-doodle"
                  >
                    <circle cx="10" cy="10" r="8.5" fill="#F3EFE6" stroke="#0B0A16" strokeWidth="1.8" />
                    <circle cx="10" cy="10" r="1.5" fill="#0B0A16" />
                    <line
                      x1="10"
                      y1="10"
                      x2="10"
                      y2="3.5"
                      stroke="#0B0A16"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      className="animate-clock-spin"
                    />
                    <line
                      x1="10"
                      y1="10"
                      x2="14.5"
                      y2="10"
                      stroke="#0B0A16"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {/* 2. Ticking digits */}
                {p.type === 'digit' && (
                  <span
                    className="font-mono font-black text-sm tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                    style={{ color: p.color }}
                  >
                    {p.text}
                  </span>
                )}

                {/* 3. Words 'tick' or 'tock' */}
                {p.type === 'word' && (
                  <span
                    className="font-mono font-bold text-xs uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                    style={{ color: p.color }}
                  >
                    {p.text}
                  </span>
                )}

                {/* 4. Sparkle cross */}
                {p.type === 'sparkle' && (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="wobble-doodle"
                  >
                    <path
                      d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
                      fill="#67E8F9"
                      stroke="#0B0A16"
                      strokeWidth="1.2"
                    />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 7.3 HAND-DRAWN DOODLES: Twinkling sparkles in yellow and coral */}
      <div className="absolute top-12 left-6 sm:left-14 pointer-events-none z-10" aria-hidden="true">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          className="wobble-doodle animate-sparkle"
          style={{ animationDelay: '0.2s' }}
        >
          <path
            d="M12 2L14 9.5L21.5 11.5L14 13.5L12 21L10 13.5L2.5 11.5L10 9.5L12 2Z"
            fill="#67E8F9"
          />
        </svg>
      </div>

      <div className="absolute top-24 right-10 sm:right-28 pointer-events-none z-10" aria-hidden="true">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          className="wobble-doodle animate-sparkle"
          style={{ animationDelay: '1.2s' }}
        >
          <path
            d="M12 2L13.5 9L20.5 10.5L13.5 12L12 19L10.5 12L3.5 10.5L10.5 9L12 2Z"
            fill="#F0997B"
          />
        </svg>
      </div>

      {/* Doodled rocket that bobs in the top-right corner with translateY & rotation loop */}
      <div
        className="absolute top-6 right-4 sm:right-10 pointer-events-none z-10 hidden sm:block"
        aria-hidden="true"
      >
        <div className="wobble-doodle animate-rocket-bob flex flex-col items-center">
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            {/* Rocket body */}
            <path
              d="M24 4C18 10 16 20 16 30L24 36L32 30C32 20 30 10 24 4Z"
              fill="#F3EFE6"
              stroke="#0B0A16"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Portal window */}
            <circle cx="24" cy="18" r="4.5" fill="#378ADD" stroke="#0B0A16" strokeWidth="2" />
            {/* Fins */}
            <path d="M16 26L8 32L16 32Z" fill="#E8572A" stroke="#0B0A16" strokeWidth="2" />
            <path d="M32 26L40 32L32 32Z" fill="#E8572A" stroke="#0B0A16" strokeWidth="2" />
            {/* Flame */}
            <path
              d="M20 36C20 42 24 46 24 46C24 46 28 42 28 36Z"
              fill="#67E8F9"
              stroke="#0B0A16"
              strokeWidth="1.5"
            />
          </svg>
          <span className="font-mono text-[9px] text-[#67E8F9] mt-0.5 tracking-wider uppercase font-bold">
            t-minus
          </span>
        </div>
      </div>

      {/* SECTION HEADER: Centered badge, Self-Drawing Loop around Title & Wavy Lime Underline */}
      <div className="text-center max-w-3xl mx-auto mb-14 relative z-10 flex flex-col items-center">
        {/* FLIGHT CALENDAR badge centered cleanly above the title */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('flight-calendar');
            if (el) scrollToY(docTop(el) - 110);
          }}
          className="group inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-chip text-xs font-mono text-[#67E8F9] mb-4 cursor-pointer"
          aria-label="Jump to the flight calendar"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E8572A]" />
          <span>FLIGHT CALENDAR</span>
          <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-y-0.5">↓</span>
        </button>

        <div className="relative inline-block px-4">
          <h2 className="font-display font-black text-3xl min-[400px]:text-4xl sm:text-6xl text-[#E6EDF7] tracking-tight relative z-10 leading-none">
            Upcoming events<span className="text-[#E8572A]">.</span>
          </h2>

          {/* 7.3 Hand-drawn loop circling the title that draws itself with stroke-dashoffset */}
          <svg
            className="absolute -inset-x-3 sm:-inset-x-8 -inset-y-4 w-[calc(100%+24px)] sm:w-[calc(100%+64px)] h-[calc(100%+32px)] pointer-events-none wobble-doodle z-0"
            viewBox="0 0 520 95"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M 32,50 C 24,20 90,8 260,10 C 430,12 498,26 496,52 C 494,78 410,88 250,86 C 90,84 38,72 46,48"
              stroke="#67E8F9"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeDasharray="1100"
              strokeDashoffset={inView ? 0 : 1100}
              style={{
                transition: 'stroke-dashoffset 1.4s cubic-bezier(0.25, 1, 0.5, 1) 0.15s',
              }}
            />
          </svg>
        </div>

        {/* Mono subtitle */}
        <p className="font-mono text-xs sm:text-sm text-[#A7A3C7] mt-4 uppercase tracking-widest relative inline-block">
          hackathons, contests, workshops
        </p>

        {/* 7.3 Wavy lime underline */}
        <div className="flex justify-center mt-1">
          <svg
            width="220"
            height="14"
            viewBox="0 0 220 14"
            fill="none"
            className="wobble-doodle pointer-events-none"
            aria-hidden="true"
          >
            <path
              d="M 5,7 Q 25,1 45,7 T 85,7 T 125,7 T 165,7 T 205,7"
              stroke="#67E8F9"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="240"
              strokeDashoffset={inView ? 0 : 240}
              style={{
                transition: 'stroke-dashoffset 1s ease-out 0.4s',
              }}
            />
          </svg>
        </div>
      </div>

      {/* 7.2 HERO TICKET CONTAINER (with 3D tilt, live countdown, and tear mechanics) */}
      <div className="relative max-w-4xl mx-auto w-full my-4 perspective-1000">
        {/* Soft radial glow of #E8572A at about 12% opacity behind ticket */}
        <div
          className="absolute inset-0 -inset-x-2 sm:-inset-x-8 -inset-y-8 rounded-3xl pointer-events-none blur-3xl z-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(232, 87, 42, 0.12) 0%, transparent 72%)',
          }}
          aria-hidden="true"
        />

        {/* 7.3 Arrow pointing at ticket with mono note "tick tock..." */}
        <div
          className="absolute -top-10 left-2 sm:left-6 z-20 pointer-events-none hidden md:flex items-center gap-2"
          aria-hidden="true"
        >
          <span className="font-mono text-xs font-bold text-[#67E8F9] tracking-wider px-2 py-0.5 rounded glass-chip">
            tick tock...
          </span>
          <svg width="55" height="35" viewBox="0 0 60 40" fill="none" className="wobble-doodle">
            <path
              d="M 5,8 C 25,6 45,15 48,30"
              stroke="#67E8F9"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeDasharray="80"
              strokeDashoffset={inView ? 0 : 80}
              style={{
                transition: 'stroke-dashoffset 0.8s ease-out 0.6s',
              }}
            />
            <path
              d="M 40,26 L 48,31 L 44,22"
              stroke="#67E8F9"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Main 3D Card Shell */}
        <div
          ref={ticketRef}
          data-cursor="rocket"
          onMouseMove={handleTicketMouseMove}
          onMouseLeave={handleTicketMouseLeave}
          onClick={() => setTicketTorn((prev) => !prev)}
          className={`relative rounded-3xl cursor-pointer transition-all duration-300 transform-style-3d ${
            !isDesktop ? 'animate-ticket-sway' : ''
          }`}
          style={{
            transform: isDesktop
              ? `perspective(1600px) rotateX(calc(var(--rx, 0) * 1deg)) rotateY(calc(var(--ry, 0) * 1deg)) ${
                  ticketTorn ? 'rotate(-1.5deg)' : ''
                }`
              : undefined,
            boxShadow: isDesktop
              ? 'calc(var(--px, 0) * -16px) calc(18px + var(--py, 0) * -8px) 44px rgba(232, 87, 42, 0.22)'
              : undefined,
            transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease',
          }}
        >
          {/* Soft light that follows the cursor */}
          {isDesktop && (
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none z-30 mix-blend-overlay"
              style={{
                background:
                  'radial-gradient(circle 320px at calc(var(--sx, 50) * 1%) calc(var(--sy, 50) * 1%), rgba(255, 255, 255, 0.22), transparent 70%)',
                opacity: 'calc(var(--hv, 0) * 0.8)',
                transition: 'opacity 0.3s',
              }}
              aria-hidden="true"
            />
          )}

          {/* Ticket Paper Body */}
          <div className={`glass glow-coral relative rounded-3xl overflow-hidden ${urgent ? 'ticket-urgent' : ''}`}>
            <div className="flex flex-col lg:flex-row items-stretch relative">
              {/* Main Ticket Section */}
              <div className={`flex-1 p-6 sm:p-10 border-b-2 lg:border-b-0 lg:border-r-2 border-dashed border-white/25 relative ${ticketTorn ? 'main-torn' : ''}`}>
                {/* Header Row: Mission Number & NEXT MISSION */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full glass-chip text-[#67E8F9] font-mono text-xs font-bold uppercase tracking-wider">
                      {heroEvent.missionNumber || 'MISSION 042'}
                    </span>
                    <span className="font-mono text-xs font-black uppercase text-[#E8572A] flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#E8572A] animate-ping" />
                      ● NEXT MISSION
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 font-mono text-xs text-[#A7A3C7] font-semibold">
                    <span
                      className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase text-white shadow-sm"
                      style={{ backgroundColor: heroEvent.verticalColor }}
                    >
                      {heroEvent.vertical}
                    </span>
                    <span>PASS #BS-20XX</span>
                  </div>
                </div>

                {/* Event Title */}
                <h3 className="font-display font-black text-2xl sm:text-4xl text-[#E6EDF7] mt-4 leading-tight break-words" style={layer(6)}>
                  {heroEvent.title}
                </h3>

                {/* Date & Location */}
                <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 text-xs font-mono text-[#E6EDF7]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Calendar className="w-4 h-4 shrink-0 text-[#E8572A]" />
                    <span>{heroEvent.dateStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-4 h-4 shrink-0 text-[#E8572A]" />
                    <span>{heroEvent.location}</span>
                  </div>
                </div>

                <p className="mt-4 text-xs sm:text-sm text-[#E6EDF7]/85 leading-relaxed font-body">
                  {heroEvent.note}
                </p>

                {/* LIVE COUNTDOWN: hourglass whose sand drains toward the event */}
                <div className="mt-6 sm:mt-8 pt-6 border-t border-white/20">
                  <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                    <span
                      className={`font-mono text-[11px] font-bold uppercase flex items-center gap-1.5 ${
                        urgent ? 'text-[#E8572A]' : 'text-[#A7A3C7]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-[#E8572A]" />
                      {countdown.isLive ? 'STATUS: LIVE NOW' : urgent ? 'FINAL HOUR' : 'T-MINUS COUNTDOWN'}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <button
                        type="button"
                        onClick={toggleTickSound}
                        aria-pressed={tickSound}
                        aria-label={tickSound ? 'Turn tick sound off' : 'Turn tick sound on'}
                        className={`font-mono text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full glass-chip cursor-pointer transition-colors ${
                          tickSound ? 'text-[#67E8F9]' : 'text-[#A7A3C7]'
                        }`}
                      >
                        {tickSound ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                        {tickSound ? 'tick on' : 'tick off'}
                      </button>
                      <span className="font-mono text-[10px] text-[#A7A3C7] flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-[#E8572A]" />
                        {ticketTorn ? 'Click to re-attach' : 'Click to tear stub'}
                      </span>
                    </span>
                  </div>

                  {countdown.isLive ? (
                    <div className="inline-flex max-w-full items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-[#E8572A] text-white font-display font-black text-base sm:text-xl shadow-lg animate-pulse">
                      <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                      <span>● LIVE IN SESSION NOW</span>
                    </div>
                  ) : (
                    <HourglassCountdown countdown={countdown} urgent={urgent} />
                  )}
                </div>
              </div>

              {/* Perforation line notches (top and bottom punched semicircles at perforation boundary) */}
              <div
                className="hidden lg:block absolute right-72 top-0 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-[#0B0A16] border-b border-white/25 z-20"
                aria-hidden="true"
              />
              <div
                className="hidden lg:block absolute right-72 bottom-0 translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-[#0B0A16] border-t border-white/25 z-20"
                aria-hidden="true"
              />

              {/* Perforated Stub Section (Rips and drops away on click) */}
              <div
                className={`w-full lg:w-72 p-6 sm:p-8 flex flex-col items-center justify-between bg-white/[0.05] backdrop-blur-md text-center relative z-10 ${
                  ticketTorn ? (isDesktop ? 'stub-torn' : 'transform rotate-[5deg] translate-y-3') : ''
                }`}
                style={{
                  transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s',
                }}
              >
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full glass-chip font-mono text-[10px] font-black uppercase text-[#E6EDF7] tracking-wider">
                    ADMIT 1 HACKER
                  </div>

                  {/* QR Doodle */}
                  <div style={layer(10)}>
                    <div className={ticketTorn ? 'qr-slide' : ''}>
                      <div className="my-4 p-3 bg-white/95 rounded-xl border border-white shadow-[0_0_30px_rgba(103,232,249,0.55)] inline-block wobble-doodle">
                        <QrCode className="w-20 h-20 text-[#0B0A16]" />
                      </div>
                    </div>
                  </div>

                  <div className="font-mono text-[10px] text-[#A7A3C7] font-semibold">
                    {ticketTorn ? 'PASS PULLED · SCAN ME' : 'SCAN OR TEAR PASS'}
                  </div>
                </div>

                <div className="mt-6 w-full" style={layer(8)}>
                  {/* Register button with hover wobble & celebratory launch on click */}
                  <button
                    type="button"
                    onClick={handleStubRegisterClick}
                    className={`w-full py-3 px-4 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-2 hover-wobble ${
                      stubRegistered
                        ? 'bg-[#1D9E75] text-white'
                        : 'bg-[#E8572A] hover:bg-[#D85A30] text-white'
                    }`}
                  >
                    {stubRegistered ? (
                      <>
                        <span>You&apos;re in!</span>
                        <Rocket className="w-4 h-4 animate-bounce" />
                      </>
                    ) : (
                      <>
                        <span>Register</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="font-mono text-[10px] text-[#A7A3C7] mt-2">
                    {ticketTorn ? 'Stub ripped! RSVP below' : 'Click ticket to tear stub'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CLICK TO TEAR: Sliding Details & Sign-Up Panel */}
        {ticketTorn && (
          <div className="mt-6 glass glow-coral p-6 sm:p-8 rounded-3xl text-[#E6EDF7] animate-wobble-subtle">
            <div className="flex items-start justify-between gap-3 border-b border-white/20 pb-4 mb-6">
              <div className="min-w-0">
                <span className="font-mono text-xs font-black uppercase text-[#E8572A] tracking-wider">
                  MISSION BRIEF & DIRECT RSVP
                </span>
                <h4 className="font-display font-black text-xl sm:text-2xl text-[#E6EDF7] mt-1 break-words">
                  {heroEvent.title}
                </h4>
                <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-xs text-[#A7A3C7]">
                  <span>📍 {heroEvent.location}</span>
                  <span>🗓 {heroEvent.dateStr}</span>
                  <span className="px-2 py-0.5 rounded text-white text-[10px] font-bold" style={{ backgroundColor: heroEvent.verticalColor }}>
                    {heroEvent.vertical}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTicketTorn(false);
                }}
                className="shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#E6EDF7] cursor-pointer"
                aria-label="Close details panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Event Details */}
              <div className="space-y-4">
                <div>
                  <h5 className="font-display font-bold text-sm text-[#E6EDF7] uppercase tracking-wide">
                    About this flight
                  </h5>
                  <p className="font-body text-xs sm:text-sm text-[#E6EDF7]/85 mt-1 leading-relaxed">
                    {heroEvent.note} Join 200+ fellow builders, hackers, and engineers. Mentorship booths, high-speed Wi-Fi, midnight energy snacks, and official hardware dev-kits provided at check-in.
                  </p>
                </div>

                <div className="p-4 rounded-xl glass-inset glow-blue space-y-2">
                  <div className="font-mono text-xs font-bold text-[#E6EDF7] flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#378ADD]" />
                    <span>Flight Checklist</span>
                  </div>
                  <ul className="text-xs font-mono text-[#E6EDF7]/85 space-y-1 list-disc list-inside">
                    <li>Bring your laptop, charger & student ID</li>
                    <li>Discord channel invite dispatched 24h prior</li>
                    <li>Solo hackers matched into squads on site</li>
                  </ul>
                </div>
              </div>

              {/* Short sign-up form: name, branch and year */}
              <div className="glass-inset glow-coral p-5 sm:p-6 rounded-2xl">
                {signupSubmitted ? (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-[#1D9E75] text-white flex items-center justify-center text-2xl mx-auto shadow-md">
                      🚀
                    </div>
                    <h5 className="font-display font-black text-xl text-[#E6EDF7]">
                      Seat Confirmed!
                    </h5>
                    <p className="font-body text-xs text-[#E6EDF7]/85">
                      Welcome aboard, <strong>{signupForm.name}</strong> ({signupForm.branch}, {signupForm.year}). Your seat is reserved for {heroEvent.title}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTicketTorn(false)}
                      className="px-5 py-2 rounded-xl glass-chip font-mono text-xs font-bold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                    <span className="font-mono text-[11px] font-black uppercase text-[#E8572A]">
                      FAST SIGN-UP
                    </span>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#E6EDF7] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jordan Lee"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-inset font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#E6EDF7] mb-1">
                        Branch / Major
                      </label>
                      <select
                        value={signupForm.branch}
                        onChange={(e) => setSignupForm({ ...signupForm, branch: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-inset font-mono text-xs"
                      >
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Robotics & AI">Robotics & AI</option>
                        <option value="Electrical & Electronics">Electrical & Electronics</option>
                        <option value="Mechanical Systems">Mechanical Systems</option>
                        <option value="Design & Human Factors">Design & Human Factors</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-xs font-bold text-[#E6EDF7] mb-1">
                        Current Year
                      </label>
                      <select
                        value={signupForm.year}
                        onChange={(e) => setSignupForm({ ...signupForm, year: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-inset font-mono text-xs"
                      >
                        <option value="1st Year">1st Year (Freshman)</option>
                        <option value="2nd Year">2nd Year (Sophomore)</option>
                        <option value="3rd Year">3rd Year (Junior)</option>
                        <option value="4th Year">4th Year (Senior)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#E8572A] hover:bg-[#D85A30] text-white font-display font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer mt-2"
                    >
                      Confirm Registration
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7.35 FLIGHT CALENDAR: month view (code-editor / mission-control theme) */}
      <FlightCalendar
        events={[heroEvent, ...upcomingEvents, ...completedEvents].filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i)}
        onSelect={setSelectedEventModal}
      />

      {/* 7.4 COMING UP: Three or more smaller tilted paper cards */}
      <div className="mt-16 sm:mt-24">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-[#E6EDF7] flex items-center gap-2">
              <span>Coming up</span>
              <span className="text-[#67E8F9]">.</span>
            </h3>
            <p className="font-mono text-xs text-[#A7A3C7] mt-1">
              Mark your calendars · Hover to straighten · Click any card for mission briefings
            </p>
          </div>
        </div>

        {/* Bento layout: the next event is the big featured card, the rest sit beside it at
            different sizes. Cards drop in one after another, tilt, and straighten on hover. */}
        <div ref={upRef} className="grid grid-cols-1 md:grid-cols-5 gap-5 md:gap-6">
          {upcomingEvents.map((evt, idx) => {
            const featured = idx === 0;
            const tilt = [-2.5, 1.8, -1.4, 2.2][idx % 4];
            const span = featured
              ? 'md:col-span-3 md:row-span-2'
              : idx % 2 === 1 ? 'md:col-span-2' : 'md:col-span-2 md:col-start-4';
            const m = evt.dateStr.split('·')[0].match(/([A-Za-z]+)\s+(\d{1,2})/);
            const month = m ? m[1] : '';
            const day = m ? m[2] : '';
            return (
              <div
                key={evt.id}
                onClick={() => setSelectedEventModal(evt)}
                className={`ev-card glass rounded-3xl cursor-pointer group flex flex-col ${span} ${featured ? 'p-7 sm:p-9 ev-float' : 'p-6'} ${upShown ? 'ev-show' : 'ev-hidden'}`}
                style={{
                  ['--tilt' as string]: `${tilt}deg`,
                  ['--delay' as string]: `${idx * 0.14}s`,
                  ['--fx' as string]: idx % 2 === 0 ? '-50px' : '50px',
                  ...glowStyle(evt.verticalColor),
                }}
              >
                {/* giant outlined day number */}
                {day && (
                  <div
                    className="absolute pointer-events-none select-none font-display font-black leading-none text-right"
                    style={{
                      top: featured ? 14 : 8,
                      right: featured ? 'clamp(12px, 4vw, 24px)' : 16,
                      fontSize: featured ? 'clamp(84px, 24vw, 150px)' : 'clamp(56px, 16vw, 76px)',
                      color: 'transparent',
                      WebkitTextStroke: `1.5px ${evt.verticalColor}88`,
                    }}
                    aria-hidden="true"
                  >
                    {day}
                  </div>
                )}

                <div className="relative flex items-center gap-3">
                  <span
                    className="px-2.5 py-1 rounded-md font-mono text-[10px] font-black uppercase text-white shadow-sm"
                    style={{ backgroundColor: evt.verticalColor }}
                  >
                    {evt.vertical}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#A7A3C7]">
                    {month} {day}
                  </span>
                </div>

                <div className="relative mt-3">
                  <CountdownChip cd={computeCountdown(evt.targetIso)} />
                </div>

                <h4
                  className={`relative font-display font-black text-[#E6EDF7] leading-snug ${featured ? 'text-2xl sm:text-4xl mt-8 sm:mt-10 sm:max-w-[80%] break-words' : 'text-lg mt-5 break-words'}`}
                >
                  {evt.title}
                </h4>

                <p className={`relative font-body text-[#E6EDF7]/85 leading-relaxed ${featured ? 'text-sm sm:text-base mt-4 max-w-[34rem]' : 'text-xs mt-2.5 line-clamp-3'}`}>
                  {evt.note}
                </p>

                <div className="relative mt-auto pt-5">
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[11px] text-[#E6EDF7] font-bold">
                    <span className="flex items-center gap-1 min-w-0 text-[#A7A3C7]">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#E8572A]" />
                      <span className="truncate max-w-[200px]">{evt.location}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5 ml-2 text-[#E8572A] group-hover:translate-x-1 transition-transform">
                      <span>Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7.5 MISSIONS COMPLETED: Dashed timeline of check-mark circles */}
      <div className="mt-20 sm:mt-28 pt-10 sm:pt-12 border-t border-white/10 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h3 className="font-display font-black text-2xl text-[#E6EDF7] flex items-center gap-2">
              <span>Missions completed</span>
              <CheckCircle2 className="w-5 h-5 text-[#1D9E75]" />
            </h3>
            <p className="font-mono text-xs text-[#A7A3C7] mt-1">
              Historical archive of executed campus operations
            </p>
          </div>

        </div>

        {/* Wave timeline: a line draws itself across the cards, which sit alternately high and low */}
        <div ref={doneRef} className="relative">
          <svg
            className="hidden lg:block absolute left-0 top-0 w-full pointer-events-none"
            style={{ height: 140 }}
            viewBox="0 0 1000 140"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M0 33 L125 33 C 250 33, 250 89, 375 89 C 500 89, 500 33, 625 33 C 750 33, 750 89, 875 89 L1000 89"
              stroke="#1D9E75"
              strokeOpacity="0.55"
              strokeWidth="2"
              strokeDasharray="6 7"
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              style={{
                strokeDashoffset: 0,
                clipPath: doneShown ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                transition: 'clip-path 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
              }}
            />
          </svg>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {completedEvents.map((pe, idx) => (
              <div
                key={pe.id}
                className={`ev-card ev-card-done p-5 rounded-2xl glass glow-green space-y-3 group relative ${idx % 2 === 1 ? 'lg:mt-14' : ''} ${doneShown ? 'ev-show' : 'ev-hidden'}`}
                style={{
                  ['--tilt' as string]: '0deg',
                  ['--delay' as string]: `${0.2 + idx * 0.16}s`,
                  ['--fx' as string]: '0px',
                }}
              >
                {/* big outlined index in the corner */}
                <div
                  className="absolute -bottom-3 right-3 pointer-events-none select-none font-display font-black leading-none"
                  style={{ fontSize: 72, color: 'transparent', WebkitTextStroke: '1.5px rgba(93,202,165,0.28)' }}
                  aria-hidden="true"
                >
                  {String(idx + 1).padStart(2, '0')}
                </div>

                <div className="relative flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div className="flex items-center gap-2">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="overflow-visible ev-check">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#1D9E75"
                        strokeWidth="2"
                        strokeDasharray="64"
                        strokeDashoffset={doneShown ? 0 : 64}
                        style={{ transition: `stroke-dashoffset 0.8s ease-out ${0.4 + idx * 0.16}s` }}
                      />
                      <path
                        d="M8 12.5L10.5 15L16 9.5"
                        stroke="#67E8F9"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="16"
                        strokeDashoffset={doneShown ? 0 : 16}
                        style={{ transition: `stroke-dashoffset 0.5s ease-out ${0.9 + idx * 0.16}s` }}
                      />
                    </svg>
                    <span className="font-mono text-xs font-bold text-[#1D9E75]">{`Event 0${idx + 1}`}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#A7A3C7]">{pe.dateStr}</span>
                </div>

                <h5 className="relative font-display font-bold text-base text-[#E6EDF7] group-hover:text-[#67E8F9] transition-colors">
                  {pe.title}
                </h5>

                <p className="relative font-mono text-xs text-[#A7A3C7] leading-relaxed line-clamp-3">{pe.note}</p>

                <div className="relative pt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-white/5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded text-white font-bold" style={{ backgroundColor: pe.verticalColor }}>
                    {pe.vertical}
                  </span>
                  <span className="text-[#A7A3C7]">{pe.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for Coming Up Event Details */}
      {selectedEventModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedEventModal(null)}
        >
          <div
            className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto glass glass-flat glow-coral p-5 sm:p-8 rounded-3xl text-[#E6EDF7]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedEventModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#E6EDF7] cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-0.5 rounded font-mono text-[10px] font-black uppercase text-white"
                style={{ backgroundColor: selectedEventModal.verticalColor }}
              >
                {selectedEventModal.vertical}
              </span>
              <span className="font-mono text-xs font-bold text-[#A7A3C7]">
                UPCOMING MISSION
              </span>
            </div>

            <h3 className="font-display font-black text-xl sm:text-2xl text-[#E6EDF7] mt-1 pr-8 break-words">
              {selectedEventModal.title}
            </h3>

            <div className="my-4 p-3 rounded-xl glass-inset font-mono text-xs space-y-1.5 text-[#E6EDF7]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E8572A]" />
                <span className="font-bold">{selectedEventModal.dateStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E8572A]" />
                <span>{selectedEventModal.location}</span>
              </div>
            </div>

            <p className="font-body text-xs sm:text-sm text-[#E6EDF7]/85 leading-relaxed">
              {selectedEventModal.note}
            </p>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedEventModal(null);
                  setTicketTorn(true);
                  scrollToY(sectionRef.current ? docTop(sectionRef.current) : 0);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#E8572A] hover:bg-[#D85A30] text-white font-display font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>RSVP to Mission</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-mono text-xs font-bold text-[#E6EDF7] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
