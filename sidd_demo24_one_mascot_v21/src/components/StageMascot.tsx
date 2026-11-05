import { useEffect, useRef, useSyncExternalStore } from 'react';
import HangingMascot from './HangingMascot';
import { getMascot, subscribeMascot } from '../utils/mascotStore';

// ONE mascot for the whole Projects stretch. It hangs from the top of the screen, fades in as the
// PROJECTS word disappears, stays put while the Projects page rises into place beneath it,
// then does the job the old Projects-page mascot did (hoodie colour follows the active project,
// nudged when the project changes) and finally leaves with the reel.
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);

export default function StageMascot() {
  const { color, kick, reel } = useSyncExternalStore(subscribeMascot, getMascot, getMascot);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef(reel);
  reelRef.current = reel;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const H = window.innerHeight;
      const scene = document.getElementById('projects-reveal');
      const proj = document.getElementById('projects');
      if (!scene || !proj) { wrap.style.opacity = '0'; return; }
      const travel = Math.max(1, scene.offsetHeight - H);
      const raw = clamp(-scene.getBoundingClientRect().top / travel);
      const inOp = ease(clamp((raw - 0.93) / 0.07)); // appears once the word has gone
      const pb = proj.getBoundingClientRect().bottom;
      const lift = Math.min(0, pb - H); // follows the reel up when it unpins at the end
      wrap.style.opacity = `${reelRef.current ? inOp : 0}`;
      wrap.style.transform = `translate3d(0, ${lift}px, 0)`;
      wrap.style.visibility = pb < 0 ? 'hidden' : 'visible';
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // the layout settles after mount (and when the reel/grid toggles)
    const t = window.setTimeout(update, 400);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reel]);

  return (
    <div
      ref={wrapRef}
      className="fixed left-0 top-0 w-full h-screen pointer-events-none overflow-hidden will-change-transform"
      style={{ opacity: 0, zIndex: 0 }}
      aria-hidden="true"
    >
      <HangingMascot color={color} kick={kick} />
    </div>
  );
}
