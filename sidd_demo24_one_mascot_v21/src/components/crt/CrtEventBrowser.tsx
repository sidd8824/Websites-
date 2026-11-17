import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ClubEvent } from '../../data/club';
import type { mountMonitor } from './mountMonitor';
import type { ScreenState } from './eventScreen';
import './crtEventBrowser.css';

interface Props {
  events: readonly ClubEvent[];
}

export default function CrtEventBrowser({ events }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const monitor = useRef<Awaited<ReturnType<typeof mountMonitor>> | null>(null);
  const [selected, setSelected] = useState(0);
  const [browsing, setBrowsing] = useState(false);
  const [page, setPage] = useState<number | null>(null);
  const [load, setLoad] = useState<'waiting' | 'ready' | 'fallback'>('waiting');
  const index = Math.min(selected, Math.max(0, events.length - 1));
  const event = events[index];
  const state = useRef<ScreenState>({ events, selected: index, page, position: index, pagePosition: page ?? 0, showEvents: browsing });
  const gesture = useRef<{ x: number; y: number; id: number; mode: 'screen' | 'cabinet' } | null>(null);
  const suppressClick = useRef(0);
  const dispatch = useRef<(step: number) => void>(() => {});

  function advance(step: number) {
    if (!browsing) { setBrowsing(true); return; }
    if (page === null) setSelected(Math.max(0, Math.min(events.length - 1, index + step)));
    else setPage(Math.max(0, Math.min(1, page + step)));
  }

  useEffect(() => {
    state.current = { events, selected: index, page, position: index, pagePosition: page ?? 0, showEvents: browsing };
    dispatch.current = advance;
    monitor.current?.invalidate();
  }, [events, index, page, browsing]);

  useEffect(() => {
    const element = stage.current;
    if (!element || !event) return;
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
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!delta) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
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
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      visibility.disconnect();
      controller.abort();
      monitor.current = null;
      element.removeEventListener('wheel', onWheel);
    };
  }, [Boolean(event)]);

  if (!event) return null;
  const toggle = () => {
    if (!browsing) setBrowsing(true);
    else setPage(current => current === null ? 0 : null);
  };
  const detail = page !== null;
  const sectionName = page === 0 ? 'Overview' : 'Date & location';
  return (
    <section className="crt-events" aria-label="Upcoming event browser"
      onKeyDown={e => {
        if (e.key === 'Escape' && detail) { e.stopPropagation(); setPage(null); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          advance(e.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <div ref={stage} className="crt-events__stage" data-lenis-prevent-horizontal
        onPointerDown={e => {
          if (!e.isPrimary || e.button !== 0) return;
          const mode = monitor.current?.target(e.clientX, e.clientY);
          if (!mode) return;
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
          if (performance.now() < suppressClick.current) return;
          const hit = monitor.current?.hit(e.clientX, e.clientY);
          if (!hit) return;
          if (!browsing) { setBrowsing(true); return; }
          if (detail) {
            if (hit.y < .20 && hit.x < .35) toggle();
            if (hit.y > .80 && hit.x > .74) advance(hit.x < .86 ? -1 : 1);
          } else if (hit.y > .20 && hit.y < .78) {
            if (hit.x > .35 && hit.x < .65) toggle();
            else advance(hit.x < .5 ? -1 : 1);
          }
        }}>
        {load !== 'ready' && (
          <div className="crt-events__fallback">
            <p className="crt-events__signal">{browsing ? event.vertical : 'B/STACK EVENTS'}</p>
            <p className="crt-events__fallback-title">{browsing ? event.title : 'Upcoming events'}</p>
            <p>{!browsing ? 'Scroll sideways to browse' : detail && page === 0 ? event.note : event.dateStr}</p>
            {detail && page === 1 && <p>{event.location}</p>}
          </div>
        )}
      </div>
      <div className="crt-events__controls">
        <div className="crt-events__status" aria-live="polite" aria-atomic="true">
          <p className="sr-only">{browsing ? event.title : 'Upcoming events'}</p>
          <p className="sr-only">{!browsing ? 'Scroll sideways to browse events' : detail ? sectionName : `${index + 1} / ${events.length} · Scroll sideways or drag across the screen`}</p>
          {detail && <p className="crt-events__detail-text">{page === 0 ? event.note : `${event.dateStr}. ${event.location}`}</p>}
        </div>
        <div className="crt-events__buttons">
          <button type="button" aria-label={detail ? 'Previous detail' : 'Previous event'}
            disabled={!browsing || (detail ? page === 0 : index === 0)} onClick={() => advance(-1)}><ArrowLeft size={17} /></button>
          <button type="button" className="crt-events__open" onClick={toggle}>
            {!browsing ? 'Browse events' : detail ? 'Back to events' : 'Open event'}
          </button>
          <button type="button" aria-label={detail ? 'Next detail' : 'Next event'}
            disabled={!browsing || (detail ? page === 1 : index === events.length - 1)} onClick={() => advance(1)}><ArrowRight size={17} /></button>
        </div>
      </div>
    </section>
  );
}
