import { useEffect, useRef, useState } from 'react';
import type { ClubEvent } from '../../data/club';
import type { mountMonitor } from './mountMonitor';
import { clampTape, settleTape } from './tapeMotion';
import { arcadeActionAt, createSnake, stepSnake, turnSnake, type ArcadeAction, type SnakeDirection } from './snake';
import { drawArcadeScreen, type ArcadeScreen } from './arcadeScreen';
import type { ScreenState } from './eventScreen';
import { DETAIL_CHAPTERS, DETAIL_END, detailChapter, detailPosition, sampleDetail } from './detailRail';
import { docTop, scrollToY } from '../../utils/scroll';
import './crtEventBrowser.css';

interface Props {
  events: readonly ClubEvent[];
}

function ArcadeFallback({ arcade, onAction }: { arcade: ArcadeScreen; onAction: (action: ArcadeAction) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#020f18';
    ctx.fillRect(0, 0, 1024, 768);
    drawArcadeScreen(ctx, arcade);
  }, [arcade]);
  return <canvas ref={canvas} width={1024} height={768} className="crt-events__arcade-fallback"
    aria-label={arcade.view === 'games' ? 'Games menu. Choose Play Snake below.' : `Snake board. Score ${arcade.snake.score}. ${arcade.snake.status}.`}
    onClick={e => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const action = arcadeActionAt((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height, arcade.view);
      if (action) onAction(action);
    }} />;
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
  const [view, setView] = useState<'events' | 'games' | 'snake'>('events');
  const [snake, setSnake] = useState(createSnake);
  const [load, setLoad] = useState<'waiting' | 'ready' | 'fallback'>('waiting');
  const index = clampTape(Math.round(selected), events.length);
  const event = events[index];
  const state = useRef<ScreenState>({ events, selected: index, page, position: clampTape(selected, events.length), pagePosition: page ?? 0, showEvents: browsing, powered });
  const gesture = useRef<{ x: number; y: number; id: number; mode: 'screen' | 'cabinet'; detailStart: number | null; tapeStart: number | null } | null>(null);
  const suppressClick = useRef(0);
  const pointerOnMonitor = useRef(false);
  const alignUntil = useRef(0);
  const settleTimer = useRef<number | undefined>(undefined);
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

  function pauseGame() {
    setSnake(current => current.status === 'running' ? { ...current, status: 'paused' } : current);
  }

  function togglePower() {
    setPowered(value => !value);
    pauseGame();
  }

  function resetMonitor() {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = undefined;
    setView('events');
    pauseGame();
    setPage(null);
    setSelected(0);
    setBrowsing(false);
    setPowered(true);
    monitor.current?.moveGrab(0, 0);
  }

  function advance(step: number) {
    if (!powered) return;
    if (view === 'games') return;
    if (view !== 'events') { gameAction(step < 0 ? 'left' : 'right'); return; }
    if (!browsing) { beginBrowsing(); return; }
    if (page === null) {
      window.clearTimeout(settleTimer.current);
      settleTimer.current = undefined;
      setSelected(clampTape(index + step, events.length));
    }
    else setPage(detailPosition(step < 0 ? Math.ceil(page) - 1 : Math.floor(page) + 1));
  }

  function openGames() {
    window.clearTimeout(settleTimer.current);
    settleTimer.current = undefined;
    setSelected(index);
    setPage(null);
    beginBrowsing();
    setView('games');
    monitor.current?.hoverTape(null);
    stage.current?.focus({ preventScroll: true });
  }

  function gameAction(action: ArcadeAction) {
    if (action === 'events') { setView('events'); return; }
    if (action === 'games') {
      pauseGame();
      setView('games');
      return;
    }
    if (action === 'play' && view === 'games') {
      setView('snake');
      setSnake(createSnake());
      return;
    }
    if (action === 'restart') { setSnake({ ...createSnake(), status: 'running' }); return; }
    if (action === 'pause' || action === 'play') {
      setSnake(current => current.status === 'over' || current.status === 'won'
        ? { ...createSnake(), status: 'running' }
        : { ...current, status: action === 'pause' && current.status === 'running' ? 'paused' : 'running' });
      return;
    }
    setSnake(current => {
      const turned = turnSnake(current, action);
      return turned.status === 'ready' ? { ...turned, status: 'running' } : turned;
    });
  }

  useEffect(() => {
    if (view !== 'snake' || !powered || snake.status !== 'running') return;
    const interval = window.setInterval(() => setSnake(current => stepSnake(current)), 160);
    return () => window.clearInterval(interval);
  }, [view, powered, snake.status]);

  useEffect(() => {
    const pause = () => setSnake(current => current.status === 'running' ? { ...current, status: 'paused' } : current);
    const visibility = () => { if (document.hidden) pause(); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); });
    if (stage.current) observer.observe(stage.current);
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    state.current = { events, selected: index, page, position: clampTape(selected, events.length), pagePosition: page ?? 0, showEvents: browsing, powered, arcade: view === 'events' ? undefined : { view, snake } };
    dispatch.current = advance;
    monitor.current?.invalidate();
  }, [events, index, selected, page, browsing, powered, view, snake]);

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
    let wheelOrigin = 0;
    let edgeTravel = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || !state.current.powered || state.current.arcade) return;
      const now = performance.now();
      const sideways = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!sideways && !state.current.showEvents) return;
      const delta = e.shiftKey ? e.deltaX || e.deltaY : sideways ? e.deltaX : e.deltaY;
      if (!delta) return;
      const movement = delta * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 320 : 1);
      const current = state.current.page ?? state.current.position;
      const end = state.current.page === null ? state.current.events.length - 1 : DETAIL_END;
      const atEdge = movement < 0 ? current <= 0 : current >= end;
      // A deliberate continued vertical scroll at either end releases the page.
      if (!sideways && atEdge) {
        edgeTravel = now - last > 240 ? Math.abs(movement) : edgeTravel + Math.abs(movement);
        last = now;
        if (edgeTravel > 180) { resetMonitor(); return; }
      } else edgeTravel = 0;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      if (state.current.page !== null) {
        setPage(value => value === null ? null : detailPosition(value + movement / 900));
        return;
      }
      if (state.current.showEvents) {
        if (now - stepped < 240) return;

        if (settleTimer.current === undefined) wheelOrigin = state.current.position;
        window.clearTimeout(settleTimer.current);
        setSelected(value => clampTape(value + movement / 540, state.current.events.length));
        settleTimer.current = window.setTimeout(() => {
          settleTimer.current = undefined;
          setSelected(value => settleTape(value, wheelOrigin, state.current.events.length));
        }, 190);
        return;
      }
      if (now - stepped < 240) return;
      if (now - last > 200 || Math.sign(total) !== Math.sign(delta)) total = 0;
      last = now;
      total += movement;
      if (Math.abs(total) >= 45) {
        dispatch.current(Math.sign(total));
        total = 0;
        stepped = now;
      }
    };
    let lastScroll = window.scrollY;
    const onScroll = () => {
      if (state.current.arcade) return;
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
      window.clearTimeout(settleTimer.current);
      settleTimer.current = undefined;
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
    if (view !== 'events') { gameAction(view === 'games' ? 'play' : 'pause'); return; }
    if (!browsing) beginBrowsing();
    else {
      window.clearTimeout(settleTimer.current);
      settleTimer.current = undefined;
      setSelected(index);
      setPage(current => current === null ? 0 : null);
    }
  };
  const detail = page !== null;
  const chapter = detailChapter(page ?? 0);
  const sectionName = DETAIL_CHAPTERS[chapter];
  const sample = sampleDetail(event);
  const excerpt = chapter === 0 ? sample.summary : chapter === 1 ? sample.agenda.join('. ') : sample.field;
  return (
    <section ref={section} className="crt-events" aria-label="Events and games monitor"
      onKeyDown={e => {
        if (view !== 'events' && powered) {
          const directions: Record<string, SnakeDirection> = {
            ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down',
            ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right',
          };
          const direction = directions[e.key] ?? directions[e.key.toLowerCase()];
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); gameAction(view === 'snake' ? 'games' : 'events'); }
          else if (direction && view === 'snake') { e.preventDefault(); e.stopPropagation(); gameAction(direction); }
          else if ((e.key === 'Enter' || e.key === ' ') && e.target === stage.current) {
            e.preventDefault();
            if (!e.repeat) gameAction(view === 'games' ? 'play' : 'pause');
          }
          return;
        }
        if (e.key === 'Escape' && browsing) {
          e.stopPropagation();
          if (page !== null) setPage(null);
          else resetMonitor();
          openButton.current?.focus({ preventScroll: true });
        }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          advance(e.key === 'ArrowLeft' ? -1 : 1);
        }
      }}>
      <div ref={stage} tabIndex={0} aria-label="Interactive monitor. Arrow keys to navigate. Games available on screen." className="crt-events__stage" data-lenis-prevent-horizontal data-lenis-prevent={browsing && view === 'events' ? true : undefined} data-display={load}
        onPointerDown={e => {
          if (!e.isPrimary || e.button !== 0) return;
          const hit = monitor.current?.hit(e.clientX, e.clientY);
          const mode = hit?.kind;
          if (powered && hit?.kind === 'screen') monitor.current?.screenRipple(hit.uv);
          pointerOnMonitor.current = mode !== undefined;
          if (mode !== 'cabinet' && mode !== 'screen') return;
          window.clearTimeout(settleTimer.current);
          settleTimer.current = undefined;
          monitor.current?.hoverTape(null);
          gesture.current = {
            x: e.clientX, y: e.clientY, id: e.pointerId, mode, detailStart: page,
            tapeStart: browsing && page === null && powered ? selected : null,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.dataset.grabbing = 'true';
        }}
        onPointerMove={e => {
          const hit = monitor.current?.hit(e.clientX, e.clientY);
          monitor.current?.screenPointer(hit?.kind === 'screen' ? hit.uv : null);
          const start = gesture.current;
          if (!start || start.id !== e.pointerId) {
            if (e.pointerType === 'mouse' && view === 'events' && browsing && !detail && powered) {
              monitor.current?.hoverTape(hit?.kind === 'screen' ? hit.uv : null);
            }
            return;
          }
          const dx = start.x - e.clientX;
          const dy = start.y - e.clientY;
          if (start.mode === 'cabinet') {
            monitor.current?.moveGrab(-dx, dy);
          } else if (view === 'events' && powered && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
            if (start.detailStart !== null) {
              setPage(detailPosition(start.detailStart + dx / (e.currentTarget.clientWidth * .52)));
            } else if (start.tapeStart !== null && Math.abs(dx) > 12) {
              setSelected(clampTape(start.tapeStart + dx / (e.currentTarget.clientWidth * .26), events.length));
            }
          }
        }}
        onPointerLeave={() => { monitor.current?.hoverTape(null); monitor.current?.screenPointer(null); }}
        onPointerUp={e => {
          const start = gesture.current;
          if (start?.id !== e.pointerId) return;
          gesture.current = null;
          delete e.currentTarget.dataset.grabbing;
          const dx = start.x - e.clientX;
          const dy = start.y - e.clientY;
          if (start.mode === 'cabinet') monitor.current?.moveGrab(0, 0);
          if (view === 'snake' && start.mode === 'screen' && Math.hypot(dx, dy) > 12) {
            gameAction(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'up' : 'down'));
            suppressClick.current = performance.now() + 400;
            return;
          }
          if (view === 'events' && Math.hypot(dx, dy) > 12) {
            suppressClick.current = performance.now() + 400;
            if (start.mode === 'screen' && start.detailStart === null && Math.abs(dx) > Math.abs(dy)) {
              if (start.tapeStart === null) {
                if (Math.abs(dx) > 28) advance(Math.sign(dx));
              }
              else setSelected(settleTape(
                clampTape(start.tapeStart + dx / (e.currentTarget.clientWidth * .26), events.length),
                start.tapeStart, events.length,
              ));
            }
          }
        }}
        onLostPointerCapture={e => {
          if (gesture.current?.id !== e.pointerId) return;
          gesture.current = null;
          delete e.currentTarget.dataset.grabbing;
          monitor.current?.moveGrab(0, 0);
          if (view === 'events' && browsing && !detail) setSelected(value => Math.round(value));
        }}
        onClick={e => {
          if (!pointerOnMonitor.current || e.target instanceof HTMLButtonElement || performance.now() < suppressClick.current) return;
          const hit = monitor.current?.hit(e.clientX, e.clientY);
          if (!hit) return;
          if (hit.kind === 'power') { togglePower(); return; }
          if (!powered) return;
          if (hit.kind === 'previous') { advance(-1); return; }
          if (hit.kind === 'next') { advance(1); return; }
          if (hit.kind === 'select') { toggle(); return; }
          if (hit.kind !== 'screen') return;
          const { x, y } = hit.uv;
          stage.current?.focus({ preventScroll: true });
          if (view !== 'events') {
            const action = arcadeActionAt(x, y, view);
            if (action) gameAction(action);
            return;
          }
          if (y < .20 && x > .59 && x < .80) { openGames(); return; }
          if (!browsing) { beginBrowsing(); return; }
          if (detail) {
            if (y < .20 && x < .35) toggle();
            if (y > .80 && x > .74) advance(x < .86 ? -1 : 1);
          } else if (y < .20 && x < .48) {
            resetMonitor();
          } else {
            const tape = monitor.current?.tapeUnder(hit.uv);
            if (tape === index) toggle();
            else if (tape != null) {
              window.clearTimeout(settleTimer.current);
              settleTimer.current = undefined;
              setSelected(tape);
            }
          }
        }}>
        {load !== 'ready' && powered && (
          <div className="crt-events__fallback">
            {view !== 'events' ? <ArcadeFallback arcade={{ view, snake }} onAction={gameAction} /> : <>
            <p className="crt-events__signal">{browsing ? event.vertical : 'B/STACK EVENTS'}</p>
            <p className="crt-events__fallback-title">{browsing ? event.title : 'Upcoming events'}</p>
            <p>{!browsing ? 'Scroll sideways to browse' : detail ? excerpt : event.dateStr}</p>
            {detail && chapter === 1 && <p>{event.location}</p>}
            </>}
          </div>
        )}
        <div className="crt-events__keys" role="group" aria-label="Monitor buttons">
          <button type="button" data-crt-key="previous"
            aria-label={view === 'snake' ? 'Snake left' : detail ? 'Previous detail' : 'Previous event'}
            disabled={!powered || view === 'games' || (view === 'events' && browsing && (detail ? page === 0 : index === 0))}
            onClick={() => advance(-1)}>Previous</button>
          <button ref={openButton} type="button" data-crt-key="select" onClick={toggle} disabled={!powered}>
            {view === 'games' ? 'Play Snake' : view === 'snake' ? 'Play or pause Snake' : !browsing ? 'Browse events' : detail ? 'Back to events' : 'Open event'}
          </button>
          <button type="button" data-crt-key="next"
            aria-label={view === 'snake' ? 'Snake right' : detail ? 'Next detail' : 'Next event'}
            disabled={!powered || view === 'games' || (view === 'events' && browsing && (detail ? page === DETAIL_END : index === events.length - 1))}
            onClick={() => advance(1)}>Next</button>
          <button type="button" data-crt-key="power"
            onClick={togglePower}>{powered ? 'Turn monitor off' : 'Turn monitor on'}</button>
        </div>
      </div>
      {powered && (
        <div className="crt-events__arcade-controls" role="group" aria-label="Monitor games">
          {view === 'events' && <button type="button" onClick={openGames}>Games</button>}
          {view === 'games' && <>
            <button type="button" onClick={() => gameAction('play')}>Play Snake</button>
            <button type="button" onClick={() => gameAction('events')}>Back to events</button>
          </>}
          {view === 'snake' && <>
            <button type="button" aria-label="Snake up" onClick={() => gameAction('up')}>↑</button>
            <button type="button" aria-label="Snake left" onClick={() => gameAction('left')}>←</button>
            <button type="button" aria-label="Snake down" onClick={() => gameAction('down')}>↓</button>
            <button type="button" aria-label="Snake right" onClick={() => gameAction('right')}>→</button>
            <button type="button" onClick={() => gameAction('pause')}>{snake.status === 'running' ? 'Pause' : 'Play'}</button>
            <button type="button" onClick={() => gameAction('restart')}>Restart</button>
            <button type="button" onClick={() => gameAction('games')}>Games</button>
          </>}
        </div>
      )}
      {view === 'snake' && <p className="sr-only" role="status">Snake. Score {snake.score}. {snake.status}.</p>}
      <div className="sr-only" aria-live="polite" aria-atomic="true" hidden={view !== 'events'}>
        <p>{!powered ? 'Monitor off' : browsing ? event.title : 'Upcoming events'}</p>
        {powered && <p>{!browsing ? 'Scroll sideways to browse events' : detail ? sectionName : `${index + 1} / ${events.length} · Scroll sideways or drag across the screen`}</p>}
        {powered && detail && <p>{excerpt}</p>}
      </div>
    </section>
  );
}
