import { useEffect, useState, useRef } from 'react';

interface ScribblePoint {
  id: number;
  x: number;
  y: number;
  created: number;
}

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  // The animated cursor only exists inside the Events section; everywhere else the normal cursor is used.
  const [active, setActive] = useState(false);
  const [cursorType, setCursorType] = useState<string | null>(null);
  const [isPointer, setIsPointer] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Coords refs
  const mouseX = useRef(-100);
  const mouseY = useRef(-100);
  const ringX = useRef(-100);
  const ringY = useRef(-100);
  const reqId = useRef<number | null>(null);

  // Scribble points for pencil mode
  const [scribbles, setScribbles] = useState<ScribblePoint[]>([]);
  const lastScribbleTime = useRef(0);

  useEffect(() => {
    // Check if touch device
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch) {
      setEnabled(false);
      return;
    }
    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check cursor data attribute or interactive elements
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const inEvents = !!target.closest('#events');
      setActive(inEvents);
      if (!inEvents) {
        setCursorType(null);
        return;
      }

      const cursorEl = target.closest('[data-cursor]') as HTMLElement | null;
      if (cursorEl) {
        const type = cursorEl.getAttribute('data-cursor');
        setCursorType(type);
      } else {
        setCursorType(null);
      }

      // Check clickable
      const clickable = !!target.closest('button, a, input, select, textarea, [role="button"]');
      setIsPointer(clickable);

      // Magnetic lean for magnetic buttons
      const magneticEl = target.closest('[data-magnetic]') as HTMLElement | null;
      if (magneticEl) {
        const rect = magneticEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.22;
        const deltaY = (e.clientY - centerY) * 0.22;
        magneticEl.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      }

      // If in pencil mode, drop scribble points
      if (cursorEl?.getAttribute('data-cursor') === 'pencil') {
        const now = Date.now();
        if (now - lastScribbleTime.current > 35) {
          lastScribbleTime.current = now;
          setScribbles((prev) => [
            ...prev.slice(-30),
            { id: Math.random(), x: e.clientX, y: e.clientY, created: now },
          ]);
        }
      }
    };

    const resetMagnetics = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const magneticEl = target?.closest('[data-magnetic]') as HTMLElement | null;
      if (magneticEl) {
        magneticEl.style.transform = 'translate3d(0, 0, 0)';
      }
    };

    const onScroll = () => {
      // Clear stuck cursor bubbles on scroll until next pointermove
      setCursorType(null);
    };

    const onMouseLeaveWindow = () => {
      setCursorType(null);
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    const onMouseEnterWindow = () => {
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseout', resetMagnetics, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseleave', onMouseLeaveWindow);
    document.addEventListener('mouseenter', onMouseEnterWindow);

    // Smooth trailing ring loop
    const animateRing = () => {
      const ease = 0.18;
      ringX.current += (mouseX.current - ringX.current) * ease;
      ringY.current += (mouseY.current - ringY.current) * ease;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX.current}px, ${ringY.current}px, 0)`;
      }

      reqId.current = requestAnimationFrame(animateRing);
    };

    reqId.current = requestAnimationFrame(animateRing);

    // Clean up expired scribbles
    const scribbleCleanup = setInterval(() => {
      const now = Date.now();
      setScribbles((prev) => prev.filter((p) => now - p.created < 1400));
    }, 200);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', resetMagnetics);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseleave', onMouseLeaveWindow);
      document.removeEventListener('mouseenter', onMouseEnterWindow);
      if (reqId.current) cancelAnimationFrame(reqId.current);
      clearInterval(scribbleCleanup);
    };
  }, []);

  if (!enabled || !active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {/* Scribble fading trails in Projects / About */}
      {scribbles.map((p) => {
        const age = (Date.now() - p.created) / 1400;
        const opacity = Math.max(0, 1 - age);
        return (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none bg-[#67E8F9]"
            style={{
              left: p.x - 2,
              top: p.y - 2,
              width: 4,
              height: 4,
              opacity: opacity * 0.5,
              transform: `scale(${1 + age * 1.5})`,
              transition: 'opacity 0.2s',
            }}
          />
        );
      })}

      {/* Center sharp dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-[#67E8F9] pointer-events-none transition-transform duration-75 ease-out shadow-[0_0_8px_rgba(221,235,107,0.8)]"
        style={{
          display: cursorType === 'rocket' || cursorType === 'pencil' || cursorType === 'wave' ? 'none' : 'block',
        }}
      />

      {/* Trailing ring & context bubbles */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none -ml-4 -mt-4 transition-[width,height,opacity] duration-200"
      >
        {/* Default / Pointer ring */}
        {!cursorType && (
          <div
            className={`rounded-full border border-[#67E8F9]/60 transition-all duration-200 ${
              isPointer ? 'w-12 h-12 -ml-2 -mt-2 bg-[#67E8F9]/15 scale-110' : 'w-8 h-8 scale-100'
            }`}
          />
        )}

        {/* View bubble on project cards */}
        {cursorType === 'view' && (
          <div className="flex items-center justify-center w-14 h-14 -ml-3 -mt-3 rounded-full bg-[#378ADD] text-[#06050E] font-mono text-xs font-bold shadow-lg scale-110 animate-wobble-subtle">
            VIEW
          </div>
        )}

        {/* Flip bubble on team cards */}
        {cursorType === 'flip' && (
          <div className="flex items-center justify-center w-14 h-14 -ml-3 -mt-3 rounded-full bg-[#67E8F9] text-[#0B0A16] font-mono text-xs font-bold shadow-lg scale-110">
            FLIP ↺
          </div>
        )}

        {/* Rocket cursor over event ticket */}
        {cursorType === 'rocket' && (
          <div className="flex items-center justify-center -ml-2 -mt-2 text-2xl filter drop-shadow-[0_0_8px_rgba(232,87,42,0.8)]">
            🚀
          </div>
        )}

        {/* Pencil cursor in projects/about */}
        {cursorType === 'pencil' && (
          <div className="flex items-center justify-center -ml-2 -mt-2 text-2xl filter drop-shadow-[0_0_6px_rgba(221,235,107,0.8)] transform -rotate-45">
            ✏️
          </div>
        )}

        {/* Open bubble cursor */}
        {cursorType === 'open' && (
          <div className="flex items-center justify-center w-14 h-14 -ml-3 -mt-3 rounded-full bg-[#67E8F9] text-[#0B0A16] font-mono text-xs font-black shadow-lg scale-110 animate-wobble-subtle">
            OPEN ↗
          </div>
        )}

        {/* Wave cursor over people */}
        {cursorType === 'wave' && (
          <div className="flex items-center justify-center -ml-2 -mt-2 text-2xl filter drop-shadow-[0_0_6px_rgba(127,119,221,0.8)]">
            👋
          </div>
        )}
      </div>
    </div>
  );
}
