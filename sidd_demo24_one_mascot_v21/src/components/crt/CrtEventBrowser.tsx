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
  const [page, setPage] = useState<number | null>(null);
  const [load, setLoad] = useState<'waiting' | 'ready' | 'fallback'>('waiting');
  const index = Math.min(selected, Math.max(0, events.length - 1));
  const event = events[index];
  const state = useRef<ScreenState>({ events, selected: index, page, position: index, pagePosition: page ?? 0, showEvents: false });
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppressClick = useRef(0);
  const dispatch = useRef<(step: number) => void>(() => {});

  function advance(step: number) {
    if (page === null) setSelected(Math.max(0, Math.min(events.length - 1, index + step)));
    else setPage(Math.max(0, Math.min(1, page + step)));
  }

  useEffect(() => {
    state.current = { events, selected: index, page, position: index, pagePosition: page ?? 0, showEvents: false };
    dispatch.current = advance;
    monitor.current?.invalidate();
  }, [events, index, page]);

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
  const toggle = () => setPage(current => current === null ? 0 : null);
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
          gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={e => {
          const start = gesture.current;
          gesture.current = null;
          if (start?.id !== e.pointerId) return;
          const dx = start.x - e.clientX;
          if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(start.y - e.clientY)) {
            suppressClick.current = performance.now() + 400;
            advance(Math.sign(dx));
          }
        }}
        onPointerCancel={() => { gesture.current = null; }}
        onClick={e => {
          if (performance.now() < suppressClick.current) return;
          const hit = monitor.current?.hit(e.clientX, e.clientY);
          if (!hit) return;
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
            <p className="crt-events__signal">{load === 'waiting' ? 'TUNING EVENT CHANNEL' : event.vertical}</p>
            <p className="crt-events__fallback-title">{event.title}</p>
            <p>{detail && page === 0 ? event.note : event.dateStr}</p>
            {detail && page === 1 && <p>{event.location}</p>}
          </div>
        )}
      </div>
      <div className="crt-events__controls">
        <div className="crt-events__status" aria-live="polite" aria-atomic="true">
          <p>{event.title}</p>
          <p>{detail ? sectionName : `${index + 1} / ${events.length} · Scroll sideways or drag`}</p>
          {detail && <p className="crt-events__detail-text">{page === 0 ? event.note : `${event.dateStr}. ${event.location}`}</p>}
        </div>
        <div className="crt-events__buttons">
          <button type="button" aria-label={detail ? 'Previous detail' : 'Previous event'}
            disabled={detail ? page === 0 : index === 0} onClick={() => advance(-1)}><ArrowLeft size={17} /></button>
          <button type="button" className="crt-events__open" onClick={toggle}>
            {detail ? 'Back to events' : 'Open event'}
          </button>
          <button type="button" aria-label={detail ? 'Next detail' : 'Next event'}
            disabled={detail ? page === 1 : index === events.length - 1} onClick={() => advance(1)}><ArrowRight size={17} /></button>
        </div>
      </div>
    </section>
  );
}
