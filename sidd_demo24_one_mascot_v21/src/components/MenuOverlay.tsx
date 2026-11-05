import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { World, makeBody, type CircleDef } from './menuPhysics';

// Full-screen navigation menu. A cream panel wipes down over the page and every section
// drops in as a chunky shape that really falls, bounces, spins and piles up at the bottom
// of the screen. Poke them with the pointer, or click one to jump to that section. Closing
// pulls the floor away: the shapes tumble out and the panel slides off.
//
// The look is deliberately the opposite of the dark site: warm paper background, flat
// saturated shapes (the site's own accent colours) and heavy ink-black type.

export interface MenuItem {
  id: string;
  label: string;
}

interface Props {
  open: boolean;
  items: MenuItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

type Kind = 'circle' | 'ellipse' | 'semi' | 'pill' | 'diamond' | 'leaf' | 'card';

interface Look {
  kind: Kind;
  w: number; // in units of u
  h: number;
  bg: string;
  fg: string;
  font: number; // font size in units of u
  circles: CircleDef[]; // collision circles, in units of u
  textDy?: number; // nudge the label (units of u)
}

const INK = '#0B0A16';
const PAPER = '#F4F0E6';

// One look per menu entry, in menu order. Colours come from the site's palette.
const LOOKS: Record<string, Look> = {
  home: {
    kind: 'circle', w: 0.95, h: 0.95, bg: INK, fg: '#67E8F9', font: 0.2,
    circles: [{ x: 0, y: 0, r: 0.475 }],
  },
  about: {
    kind: 'semi', w: 1.7, h: 0.85, bg: '#7C5CF0', fg: '#FFFFFF', font: 0.24, textDy: 0.16,
    circles: [-0.425, 0, 0.425].map((x) => ({ x, y: 0, r: 0.425 })),
  },
  verticals: {
    kind: 'pill', w: 2.0, h: 0.7, bg: '#67E8F9', fg: INK, font: 0.22,
    circles: [-0.65, 0, 0.65].map((x) => ({ x, y: 0, r: 0.35 })),
  },
  projects: {
    kind: 'diamond', w: 1.5, h: 1.5, bg: '#F97316', fg: INK, font: 0.17,
    circles: [{ x: 0, y: 0, r: 0.55 }],
  },
  events: {
    kind: 'leaf', w: 1.7, h: 0.95, bg: '#E879F9', fg: INK, font: 0.23,
    circles: [-0.5, 0, 0.5].map((x) => ({ x, y: 0, r: 0.42 })),
  },
  team: {
    kind: 'card', w: 1.4, h: 0.95, bg: '#FFFFFF', fg: INK, font: 0.27,
    circles: [-0.225, 0.225].map((x) => ({ x, y: 0, r: 0.475 })),
  },
};

const FALLBACK_COLOURS = ['#E3C46E', '#7C5CF0', '#67E8F9', '#F97316', '#E879F9'];

function lookFor(id: string, index: number): Look {
  return (
    LOOKS[id] ?? {
      kind: 'ellipse', w: 1.6, h: 0.9, bg: FALLBACK_COLOURS[index % FALLBACK_COLOURS.length], fg: INK, font: 0.22,
      circles: [-0.35, 0, 0.35].map((x) => ({ x, y: 0, r: 0.45 })),
    }
  );
}

function shapeStyle(look: Look, wPx: number, hPx: number): CSSProperties {
  const base: CSSProperties = { width: wPx, height: hPx, background: look.bg };
  switch (look.kind) {
    case 'circle':
      return { ...base, borderRadius: '50%' };
    case 'ellipse':
      return { ...base, borderRadius: '50%' };
    case 'semi':
      return { ...base, borderRadius: '50% 50% 0 0 / 100% 100% 0 0' };
    case 'pill':
      return { ...base, borderRadius: 9999 };
    case 'diamond':
      return { ...base, clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' };
    case 'leaf':
      return { ...base, borderRadius: '0 100% 0 100% / 0 100% 0 100%' };
    case 'card':
      return { ...base, borderRadius: 8, border: `2px solid ${INK}`, boxSizing: 'border-box' };
  }
}

// Size of one design unit, from the viewport. Desktop shapes are big and bold; phones get a
// smaller unit so the whole pile still fits.
function unitFor(w: number, h: number) {
  if (w < 640) return Math.max(92, Math.min(w * 0.34, h * 0.2));
  return Math.max(120, Math.min(w * 0.2, h * 0.28, 230));
}

const PANEL_MS = 650;

export default function MenuOverlay({ open, items, activeId, onSelect, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false); // panel has wiped in
  const [leaving, setLeaving] = useState(false); // panel is wiping out
  const [unit, setUnit] = useState(200);

  const rootRef = useRef<HTMLDivElement>(null);
  const shapeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const worldRef = useRef<World | null>(null);
  const rafRef = useRef(0);
  const closeTimer = useRef<number | undefined>(undefined);
  const mountedRef = useRef(false);
  const unitRef = useRef(200);
  const reducedRef = useRef(false);
  const grabRef = useRef<{ moved: boolean; sx: number; sy: number } | null>(null);
  const suppressClick = useRef(false);

  mountedRef.current = mounted;

  const buildWorld = () => {
    const root = rootRef.current;
    const W = root?.clientWidth ?? window.innerWidth;
    const H = root?.clientHeight ?? window.innerHeight;
    const u = unitFor(W, H);
    unitRef.current = u;
    setUnit(u);

    const world = new World(W, H, H + u * 0.1);
    const n = items.length;
    // Drop them in a shuffled order and from clustered x positions, so they land on and
    // beside each other and form a pile rather than a neat row.
    const order = items.map((_, i) => i).sort(() => Math.random() - 0.5);
    items.forEach((item, i) => {
      const look = lookFor(item.id, i);
      const body = makeBody(
        item.id,
        look.circles.map((c) => ({ x: c.x * u, y: c.y * u, r: c.r * u })),
      );
      const slot = order.indexOf(i);
      const spread = 0.16 + 0.68 * ((slot + 0.5) / n);
      body.x = W * spread + (Math.random() - 0.5) * u * 0.8;
      body.y = -u * (1.1 + Math.random() * 0.6);
      body.a = (Math.random() - 0.5) * 1.4;
      body.vy = 150 + Math.random() * 250;
      body.w = (Math.random() - 0.5) * 6;
      body.delay = 0.22 + slot * 0.1 + Math.random() * 0.05;
      world.bodies.push(body);
    });

    if (reducedRef.current) {
      for (const b of world.bodies) b.delay = 0;
      world.settle(4);
    }
    worldRef.current = world;
  };

  const paint = () => {
    const world = worldRef.current;
    if (!world) return;
    for (const b of world.bodies) {
      const el = shapeRefs.current[b.id];
      if (!el) continue;
      el.style.opacity = b.live ? '1' : '0';
      el.style.transform = `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0) translate(-50%, -50%) rotate(${b.a.toFixed(4)}rad)`;
    }
  };

  // open / close
  useEffect(() => {
    if (open) {
      window.clearTimeout(closeTimer.current);
      reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setLeaving(false);
      if (mountedRef.current) {
        // re-opened while still wiping out: restart the drop
        buildWorld();
        setShown(true);
        return;
      }
      setMounted(true);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(r1);
        cancelAnimationFrame(r2);
      };
    }

    if (mountedRef.current) {
      // pull the floor away: shapes tumble out while the panel slides off
      const world = worldRef.current;
      if (world) {
        world.hasFloor = false;
        world.gravity = 3200;
        for (const b of world.bodies) {
          b.live = true;
          b.vy += 350 + Math.random() * 250;
          b.w += (Math.random() - 0.5) * 3;
        }
      }
      setLeaving(true);
      closeTimer.current = window.setTimeout(() => {
        setMounted(false);
        setShown(false);
        setLeaving(false);
      }, PANEL_MS + 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // simulation loop: runs while the overlay is mounted
  useLayoutEffect(() => {
    if (!mounted) return;
    buildWorld();
    paint();
    if (reducedRef.current) return;

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      worldRef.current?.step(dt);
      paint();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // keep the walls and floor in step with the window
  useEffect(() => {
    if (!mounted) return;
    const onResize = () => {
      const root = rootRef.current;
      const world = worldRef.current;
      if (!root || !world) return;
      world.resize(root.clientWidth, root.clientHeight, root.clientHeight + unitRef.current * 0.1);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mounted]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Shapes only move when you hold them: press on one, drag, and let go to throw it.
  const toLocal = (clientX: number, clientY: number) => {
    const r = rootRef.current?.getBoundingClientRect();
    return r ? { x: clientX - r.left, y: clientY - r.top } : null;
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    const world = worldRef.current;
    if (!world || reducedRef.current || !open || e.button !== 0) return;
    const pt = toLocal(e.clientX, e.clientY);
    if (!pt) return;
    const body = world.pick(pt.x, pt.y);
    if (!body) return;

    world.startGrab(body, pt.x, pt.y);
    grabRef.current = { moved: false, sx: e.clientX, sy: e.clientY };
    rootRef.current?.setAttribute('data-grab', '1');

    const move = (ev: PointerEvent) => {
      const p = toLocal(ev.clientX, ev.clientY);
      if (!p) return;
      worldRef.current?.moveGrab(p.x, p.y);
      const g = grabRef.current;
      if (g && !g.moved && Math.hypot(ev.clientX - g.sx, ev.clientY - g.sy) > 6) g.moved = true;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      worldRef.current?.endGrab();
      const moved = grabRef.current?.moved;
      grabRef.current = null;
      rootRef.current?.removeAttribute('data-grab');
      if (moved) {
        // a drag is not a click: don't jump to the section when you let go
        suppressClick.current = true;
        window.setTimeout(() => (suppressClick.current = false), 60);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  if (!mounted) return null;

  const panelY = leaving ? '100%' : shown ? '0%' : '-100%';
  const u = unit;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      onPointerDown={onPointerDown}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 39,
        overflow: 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <style>{`
        .bs-menu-shape { transition: transform .22s cubic-bezier(.3,1.6,.5,1); }
        .bs-menu-btn:hover .bs-menu-shape, .bs-menu-btn:focus-visible .bs-menu-shape { transform: scale(1.09); }
        [data-grab='1'], [data-grab='1'] .bs-menu-btn { cursor: grabbing !important; }
        .bs-menu-btn:focus-visible { outline: 3px solid ${INK}; outline-offset: 4px; border-radius: 12px; }
      `}</style>

      {/* the paper panel */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: PAPER,
          backgroundImage: 'radial-gradient(rgba(11,10,22,0.10) 1.5px, transparent 1.6px)',
          backgroundSize: '28px 28px',
          transform: `translateY(${panelY})`,
          transition: shown || leaving ? `transform ${PANEL_MS}ms cubic-bezier(.76,0,.24,1)` : 'none',
          willChange: 'transform',
          boxShadow: leaving ? '0 -30px 60px rgba(0,0,0,.25)' : 'none',
        }}
      />

      {/* the falling shapes */}
      {items.map((item, i) => {
        const look = lookFor(item.id, i);
        const wPx = look.w * u;
        const hPx = look.h * u;
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            ref={(el) => {
              shapeRefs.current[item.id] = el;
            }}
            type="button"
            className="bs-menu-btn"
            onClick={() => {
              if (suppressClick.current) return;
              onSelect(item.id);
            }}
            aria-label={item.label}
            aria-current={active ? 'true' : undefined}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: wPx,
              height: hPx,
              padding: 0,
              margin: 0,
              border: 0,
              background: 'none',
              opacity: 0,
              cursor: 'grab',
              willChange: 'transform',
            }}
          >
            <span
              className="bs-menu-shape"
              style={{
                ...shapeStyle(look, wPx, hPx),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: look.textDy ? look.textDy * u : 0,
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  color: look.fg,
                  fontFamily: "var(--font-display, 'Bricolage Grotesque', 'Archivo Black', sans-serif)",
                  fontWeight: 800,
                  fontSize: look.font * u,
                  lineHeight: 1,
                  letterSpacing: '-0.015em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: look.font * u * 0.28,
                }}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    style={{ width: look.font * u * 0.32, height: look.font * u * 0.32, borderRadius: '50%', background: look.fg }}
                  />
                )}
                {item.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
