import { useEffect, useRef, useState } from 'react';
import type { ClubEvent } from '../../data/club';
import type { mountMonitor } from './mountMonitor';
import type { ScreenState } from './eventScreen';
import { docTop, scrollToY } from '../../utils/scroll';
import './crtEventBrowser.css';

interface Props {
  events: readonly ClubEvent[];
}

export default function CrtEventBrowser({ events }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const monitor = useRef<Awaited<ReturnType<typeof mountMonitor>> | null>(null);
  const [selected, setSelected] = useState(0);
  const [powered, setPowered] = useState(true);
  const [browsing, setBrowsing] = useState(false);
  const [page, setPage] = useState<number | null>(null);
  const [load, setLoad] = useState<'waiting' | 'ready' | 'fallback'>('waiting');
  const index = Math.min(selected, Math.max(0, events.length - 1));
  const event = events[index];
  const state = useRef<ScreenState>({ events, selected: index, page, position: index, pagePosition: page ?? 0, showEvents: browsing, powered });
  const gesture = useRef<{ x: number; y: number; id: number; mode: 'screen' | 'cabinet' } | null>(null);
  const suppressClick = useRef(0);
  const alignUntil = useRef(0);
  const dispatch = useRef<(step: number) => void>(() => {});

  function beginBrowsing() {
    const element = stage.current;
    if (element) {
      const center = docTop(element) + element.clientHeight / 2;
      const target = Math.max(0, center - (window.innerHeight + 64) / 2);
      if (Math.abs(target - window.scrollY) > 32) {
        alignUntil.current = performance.now() + 850;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          window.scrollTo({ top: target, behavior: 'instant' });
        } else {
          scrollToY(target, .65);
        }
      }
    }
    setBrowsing(true);
  }

  function resetMonitor() {
    setPage(null);
    setSelected(0);
    setBrowsing(false);
    setPowered(true);
    monitor.current?.moveGrab(0, 0);
  }

  function advance(step: number) {
    if (!powered) return;
    if (!browsing) { beginBrowsing(); return; }
    if (page === null) setSelected(Math.max(0, Math.min(events.length - 1, index + step)));
    else setPage(Math.max(0, Math.min(1, page + step)));
  }

  useEffect(() => {
    state.current = { events, selected: index, page, position: index, pagePosition: page ?? 0, showEvents: browsing, powered };
    dispatch.current = advance;
    monitor.current?.invalidate();
  }, [events, index, page, browsing, powered]);

  useEffect(() => {
    const element = stage.current;
    const input = section.current;
    if (!element || !input || !event) return;
    const controller = new AbortController();
    const visibility = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      visibility.disconnect();
      import('./mountMonitor')
        .then(({ mountMonitor }) => mountMonitor(element, () => state.current, controller.signal))
        .then(view => {
          if (controller.signal.aborted) return;
          monitor.current = view;
          setLoad('ready');
          view.invalidate();
        })
        .catch(() => { if (!controller.signal.aborted) setLoad('fallback'); });
    }, { rootMargin: '400px' });
    visibility.observe(element);

    let total = 0;
    let last = -Infinity;
    let stepped = -Infinity;
    let returnUntil = -Infinity;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      const now = performance.now();
      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!sideways && e.deltaY > 0 && (state.current.showEvents || now < returnUntil)) {
        // Let the return finish before the same wheel gesture carries the page past it.
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        if (now >= returnUntil) {
          total = 0;
          returnUntil = now + 850;
          resetMonitor();
        }
        return;
      }
      if (!sideways || !state.current.powered || now < returnUntil) return;
      const delta = e.deltaX || e.deltaY;
      if (!delta) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      if (now - stepped < 240) return;
      if (now - last > 200 || Math.sign(total) !== Math.sign(delta)) total = 0;
      last = now;
      total += delta * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 320 : 1);
      if (Math.abs(total) >= 45) {
        dispatch.current(Math.sign(total));
        total = 0;
        stepped = now;
      }
    };
    let lastScroll = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const movingDown = y > lastScroll;
      lastScroll = y;
      if (!movingDown || performance.now() < alignUntil.current || (!state.current.showEvents && state.current.powered)) return;
      total = 0;
      resetMonitor();
    };
    input.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      visibility.disconnect();
      controller.abort();
      monitor.current = null;
      input.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
    };
  }, [Boolean(event)]);

  if (!event) return null;
  const toggle = () => {
    if (!powered) return;
    if (!browsing) beginBrowsing();
    else setPage(current => current === null ? 0 : null);
  };
  const detail = page !== null;
  const sectionName = page === 0 ? 'Overview' : 'Date & location';
  return (
    <section ref={section} className="crt-events" aria-label="Upcoming event browser"
      onKeyDown={e => {
        if (e.key === 'Escape' && browsing) {
          e.stopPropagation();
          resetMonitor();
          openButton.current?.focus({ preventScroll: true });
        }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          advance(e.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <div ref={stage} className="crt-events__stage" data-lenis-prevent-horizontal data-display={load}
        onPointerDown={e => {
          if (!e.isPrimary || e.button !== 0) return;
          const mode = monitor.current?.hit(e.clientX, e.clientY)?.kind;
          if (mode !== 'cabinet' && mode !== 'screen') return;
          gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId, mode };
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.dataset.grabbing = 'true';
        }}
        onPointerMove={e => {
          const start = gesture.current;
          if (start?.id !== e.pointerId || start.mode !== 'cabinet') return;
          monitor.current?.moveGrab(e.clientX - start.x, start.y - e.clientY);
        }}
        onPointerUp={e => {
          const start = gesture.current;
          if (start?.id !== e.pointerId) return;
          gesture.current = null;
          delete e.currentTarget.dataset.grabbing;
          const dx = start.x - e.clientX;
          const dy = start.y - e.clientY;
          if (start.mode === 'cabinet') monitor.current?.moveGrab(0, 0);
          if (Math.hypot(dx, dy) > 12) {
            suppressClick.current = performance.now() + 400;
            if (start.mode === 'screen' && Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
              advance(Math.sign(dx));
            }
          }
        }}
        onLostPointerCapture={e => {
          if (gesture.current?.id !== e.pointerId) return;
          gesture.current = null;
          delete e.currentTarget.dataset.grabbing;
          monitor.current?.moveGrab(0, 0);
        }}
        onClick={e => {
          if (e.target instanceof HTMLButtonElement || performance.now() < suppressClick.current) return;
          const hit = monitor.current?.hit(e.clientX, e.clientY);
          if (!hit) return;
          if (hit.kind === 'power') { setPowered(value => !value); return; }
          if (!powered) return;
          if (hit.kind === 'previous') { advance(-1); return; }
          if (hit.kind === 'next') { advance(1); return; }
          if (hit.kind === 'select') { toggle(); return; }
          if (hit.kind !== 'screen') return;
          const { x, y } = hit.uv;
          if (!browsing) { beginBrowsing(); return; }
          if (detail) {
            if (y < .20 && x < .35) toggle();
            if (y > .80 && x > .74) advance(x < .86 ? -1 : 1);
          } else if (y < .20 && x < .48) {
            resetMonitor();
          } else if (y > .20 && y < .78) {
            if (x > .35 && x < .65) toggle();
            else advance(x < .5 ? -1 : 1);
          }
        }}>
        {load !== 'ready' && powered && (
          <div className="crt-events__fallback">
            <p className="crt-events__signal">{browsing ? event.vertical : 'B/STACK EVENTS'}</p>
            <p className="crt-events__fallback-title">{browsing ? event.title : 'Upcoming events'}</p>
            <p>{!browsing ? 'Scroll sideways to browse' : detail && page === 0 ? event.note : event.dateStr}</p>
            {detail && page === 1 && <p>{event.location}</p>}
          </div>
        )}
        <div className="crt-events__keys" role="group" aria-label="Monitor buttons">
          <button type="button" data-crt-key="previous"
            aria-label={detail ? 'Previous detail' : 'Previous event'}
            disabled={!powered || (browsing && (detail ? page === 0 : index === 0))}
            onClick={() => advance(-1)}>Previous</button>
          <button ref={openButton} type="button" data-crt-key="select" onClick={toggle} disabled={!powered}>
            {!browsing ? 'Browse events' : detail ? 'Back to events' : 'Open event'}
          </button>
          <button type="button" data-crt-key="next"
            aria-label={detail ? 'Next detail' : 'Next event'}
            disabled={!powered || (browsing && (detail ? page === 1 : index === events.length - 1))}
            onClick={() => advance(1)}>Next</button>
          <button type="button" data-crt-key="power"
            onClick={() => setPowered(value => !value)}>{powered ? 'Turn monitor off' : 'Turn monitor on'}</button>
        </div>
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        <p>{!powered ? 'Monitor off' : browsing ? event.title : 'Upcoming events'}</p>
        {powered && <p>{!browsing ? 'Scroll sideways to browse events' : detail ? sectionName : `${index + 1} / ${events.length} · Scroll sideways or drag across the screen`}</p>}
        {powered && detail && <p>{page === 0 ? event.note : `${event.dateStr}. ${event.location}`}</p>}
      </div>
    </section>
  );
}
