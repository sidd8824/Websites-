import { useEffect, useId, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ClubEvent } from '../data/club';

// FLIGHT CALENDAR - a month view dressed as a code editor + mission control.
//  - the tabs are the club's tracks AND the filter: each one "speaks" its own language
//    (B/Algo = Python, B/Uild = Arduino C++, B/Hack = git/shell, B/Dev = Java)
//  - every day shows its number in binary (tiny, faint) because why not
//  - event days get a track glyph; a dashed flight path (Catmull-Rom spline) links the missions
//    in order and a little ship flies along it
//  - the console on the right "runs" a snippet in the selected language, with real values computed
//    from the events (days to launch, missions queued), typed out like a terminal

type Filter = 'ALL' | 'B/Algo' | 'B/Uild' | 'B/Hack' | 'B/Dev';

const TABS: { id: Filter; label: string; file: string; color: string }[] = [
  { id: 'ALL', label: 'ALL', file: 'mission_control.sh', color: '#67E8F9' },
  { id: 'B/Algo', label: 'B/Algo', file: 'route_planner.py', color: '#9D8FE6' },
  { id: 'B/Uild', label: 'B/Uild', file: 'flight_ctrl.ino', color: '#3DDBA5' },
  { id: 'B/Hack', label: 'B/Hack', file: 'ship_it.sh', color: '#FF8F63' },
  { id: 'B/Dev', label: 'B/Dev', file: 'FlightCalendar.java', color: '#6DB6F5' },
];

const GLYPH: Record<string, string> = { 'B/Algo': 'Σ', 'B/Uild': '⚙', 'B/Hack': '⚡', 'B/Dev': '{}', All: '★' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const keyOf = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const short = (e: ClubEvent) => {
  const t = e.title.replace(/^(Event \d+|B\/\w+):\s*/, '');
  return t.length > 36 ? `${t.slice(0, 35)}…` : t;
};
const label = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;

/** Catmull-Rom spline through the points, as an SVG cubic-bezier path. */
function spline(pts: [number, number][]) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** The code the console "runs" for the selected track, filled with real numbers. */
function snippet(f: Filter, next: ClubEvent | undefined, days: number, queued: number): string {
  if (!next) {
    const none = '// no missions queued for this track yet.\n// watch this space, launch window opening soon.';
    return f === 'B/Algo' || f === 'ALL' ? none.replace(/\/\//g, '#') : none;
  }
  const t = short(next);
  const when = label(new Date(next.targetIso));
  switch (f) {
    case 'B/Algo':
      return [
        '>>> nxt = min(m for m in missions if m.track == "B/Algo")',
        '>>> nxt.title',
        `'${t}'`,
        '>>> (nxt.date - today).days',
        `${days}`,
        '>>> sum(1 for m in missions if m.track == "B/Algo")  # O(n)',
        `${queued}`,
      ].join('\n');
    case 'B/Uild':
      return [
        '// B/Uild flight controller',
        `const int DAYS_TO_LAUNCH = ${days};`,
        'void loop() {',
        '  if (DAYS_TO_LAUNCH == 0) {',
        '    digitalWrite(SOLDER_IRON, HIGH);',
        '  }',
        '}',
        `// armed: "${t}"`,
      ].join('\n');
    case 'B/Hack':
      return [
        '$ git log --oneline --grep="B/Hack" -1',
        `a36f2c1 ${t} -> ${when}`,
        `$ echo "$(( ${days} * 24 )) hours to ship"`,
        `> ${days * 24} hours to ship`,
        '$ git commit -m "ship it" && git push',
      ].join('\n');
    case 'B/Dev':
      return [
        'Mission next = missions.stream()',
        '    .filter(m -> m.track().equals("B/Dev"))',
        '    .min(Comparator.comparing(Mission::date))',
        '    .orElseThrow();',
        `// next.title() -> "${t}"`,
        `// DAYS.between(today, next.date()) -> ${days}`,
      ].join('\n');
    default:
      return [
        '$ ./mission-control --next',
        `> ${t}`,
        `> T-${days}d · ${when}`,
        '$ ./mission-control --count',
        `> ${queued} missions queued`,
      ].join('\n');
  }
}

function ConsoleLine({ line, color }: { line: string; color: string }) {
  if (/^\s*(\/\/|#)/.test(line)) return <div className="text-[#A7A3C7]/70">{line || ' '}</div>;
  const m = line.match(/^(\$ |>>> |> )(.*)$/);
  if (m) {
    const prompt = m[1] === '> ';
    return (
      <div>
        <span style={{ color }} className="font-bold">{m[1]}</span>
        <span className={prompt ? 'text-[#5DCAA5]' : 'text-[#E6EDF7]'}>{m[2]}</span>
      </div>
    );
  }
  return <div className="text-[#E6EDF7]">{line || ' '}</div>;
}

export default function FlightCalendar({
  events,
  onSelect,
}: {
  events: ClubEvent[];
  onSelect: (e: ClubEvent) => void;
}) {
  const uid = useId().replace(/:/g, '');
  const now = useMemo(() => new Date(), []);
  const todayKey = keyOf(now);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [filter, setFilter] = useState<Filter>('ALL');
  const tab = TABS.find((t) => t.id === filter)!;

  // start on the month of the next mission (or today's month if everything is in the past)
  const firstUpcoming = useMemo(
    () => [...events].filter((e) => new Date(e.targetIso).getTime() >= now.getTime()).sort((a, b) => +new Date(a.targetIso) - +new Date(b.targetIso))[0],
    [events, now],
  );
  const startDate = firstUpcoming ? new Date(firstUpcoming.targetIso) : now;
  const [cursor, setCursor] = useState({ y: startDate.getFullYear(), m: startDate.getMonth() });

  const shift = (n: number) => setCursor((c) => {
    const d = new Date(c.y, c.m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // ---- month grid ----
  const first = new Date(cursor.y, cursor.m, 1);
  const offset = first.getDay();
  const dim = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const rows = Math.ceil((offset + dim) / 7);

  const matches = (e: ClubEvent) => filter === 'ALL' || e.vertical === filter;
  const byDay = useMemo(() => {
    const map = new Map<number, ClubEvent[]>();
    events.forEach((e) => {
      const k = keyOf(new Date(e.targetIso));
      map.set(k, [...(map.get(k) ?? []), e]);
    });
    return map;
  }, [events]);

  const monthEvents = events
    .filter((e) => {
      const d = new Date(e.targetIso);
      return d.getFullYear() === cursor.y && d.getMonth() === cursor.m && matches(e);
    })
    .sort((a, b) => +new Date(a.targetIso) - +new Date(b.targetIso));

  // ---- flight path: today's launch pad (if in this month) -> every mission, in order ----
  const centre = (day: number): [number, number] => {
    const i = offset + day - 1;
    return [(i % 7) * 100 + 50, Math.floor(i / 7) * 100 + 50];
  };
  const waypoints: [number, number][] = [];
  if (now.getFullYear() === cursor.y && now.getMonth() === cursor.m) waypoints.push(centre(now.getDate()));
  monthEvents.forEach((e) => {
    const p = centre(new Date(e.targetIso).getDate());
    const last = waypoints[waypoints.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) waypoints.push(p);
  });
  const path = waypoints.length > 1 ? spline(waypoints) : '';

  // ---- console text ----
  const upcoming = events
    .filter((e) => matches(e) && new Date(e.targetIso).getTime() >= now.getTime())
    .sort((a, b) => +new Date(a.targetIso) - +new Date(b.targetIso));
  const next = upcoming[0];
  const days = next ? Math.max(0, Math.ceil((new Date(next.targetIso).getTime() - now.getTime()) / 864e5)) : 0;
  const text = snippet(filter, next, days, upcoming.length);

  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (reduce) { setTyped(text.length); return; }
    setTyped(0);
    const id = window.setInterval(() => {
      setTyped((n) => {
        if (n >= text.length) { window.clearInterval(id); return n; }
        return n + 3;
      });
    }, 16);
    return () => window.clearInterval(id);
  }, [text, reduce]);

  const typedLines = text.slice(0, typed).split('\n');
  const done = typed >= text.length;

  return (
    <div id="flight-calendar" className="mt-16 sm:mt-24 relative z-10 w-full min-w-0">
      <div className="glass glass-flat rounded-3xl overflow-hidden" style={{ ['--glow' as string]: '103 232 249' }}>
        {/* editor chrome */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 border-b border-white/10 bg-black/25">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="font-mono text-[11px] text-[#A7A3C7] truncate min-w-0">~/bstack/upcoming-events/{tab.file}</span>
          <span className="ml-auto hidden sm:inline font-mono text-[10px] text-[#A7A3C7]/70">HEAD → main · UTF-8</span>
        </div>

        {/* tabs = filters */}
        <div role="tablist" aria-label="Filter missions by track" className="flex overflow-x-auto border-b border-white/10 bg-black/10">
          {TABS.map((t) => {
            const on = t.id === filter;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(t.id)}
                className="shrink-0 px-4 py-2.5 font-mono text-xs cursor-pointer transition-colors border-b-2"
                style={{
                  color: on ? '#fff' : '#A7A3C7',
                  borderColor: on ? t.color : 'transparent',
                  background: on ? 'rgba(255,255,255,0.06)' : 'transparent',
                }}
              >
                <span style={{ color: t.color }}>{t.id === 'ALL' ? '$_' : GLYPH[t.id]}</span> {t.label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-5 gap-0">
          {/* CALENDAR */}
          <div className="lg:col-span-3 min-w-0 p-3 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
              <h3 className="font-display font-black text-xl min-[400px]:text-2xl sm:text-3xl text-[#E6EDF7] leading-none">
                {MONTHS[cursor.m]} <span className="text-[#67E8F9]">{cursor.y}</span>
              </h3>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  onClick={() => shift(-1)}
                  aria-label="Previous month"
                  className="p-1.5 rounded-lg glass-chip text-[#E6EDF7] cursor-pointer"
                ><ChevronLeft className="w-4 h-4" /></button>
                <button
                  onClick={() => setCursor({ y: startDate.getFullYear(), m: startDate.getMonth() })}
                  className="px-2.5 py-1.5 rounded-lg glass-chip text-[#67E8F9] cursor-pointer"
                >next mission</button>
                <button
                  onClick={() => shift(1)}
                  aria-label="Next month"
                  className="p-1.5 rounded-lg glass-chip text-[#E6EDF7] cursor-pointer"
                ><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center font-mono text-[9px] sm:text-[10px] tracking-widest text-[#A7A3C7]/80 py-1">{w}</div>
              ))}
            </div>

            <div className="relative">
              <div className="grid grid-cols-7">
                {Array.from({ length: rows * 7 }, (_, i) => {
                  const day = i - offset + 1;
                  if (day < 1 || day > dim) return <div key={i} style={{ aspectRatio: '1' }} />;
                  const date = new Date(cursor.y, cursor.m, day);
                  const k = keyOf(date);
                  const evs = byDay.get(k) ?? [];
                  const shown = evs.filter(matches);
                  const isToday = k === todayKey;
                  const past = k < todayKey;
                  const lead = shown[0];
                  const live = shown.find((e) => new Date(e.targetIso).getTime() >= now.getTime() - 864e5 && e.status !== 'completed');
                  const faded = filter !== 'ALL' && evs.length > 0 && shown.length === 0;
                  const color = lead?.verticalColor ?? '#fff';
                  const inner = (
                    <>
                      <span className={`absolute top-1 left-1.5 font-mono font-bold text-[10px] sm:text-sm ${isToday ? 'text-[#67E8F9]' : 'text-[#E6EDF7]'}`}>{day}</span>
                      <span className="absolute bottom-0.5 left-1.5 hidden sm:block font-mono text-[7px] tracking-wider text-white/25 select-none">{day.toString(2).padStart(5, '0')}</span>
                      {isToday && <span className="absolute top-1 right-1.5 fc-blink font-mono text-[10px] text-[#67E8F9]" aria-label="today">█</span>}
                      {lead && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center font-mono font-black text-base sm:text-2xl ${live ? 'fc-pulse' : ''}`}
                          style={{ color, textShadow: `0 0 14px ${color}`, ['--fc' as string]: color }}
                        >
                          {lead.status === 'completed' && !live ? '✓' : GLYPH[lead.vertical]}
                        </span>
                      )}
                      {shown.length > 1 && (
                        <span className="absolute bottom-0.5 right-1 font-mono text-[8px] sm:text-[10px] font-bold text-white bg-white/20 rounded px-1">×{shown.length}</span>
                      )}
                    </>
                  );
                  const cls = `fc-cell absolute inset-[2px] sm:inset-[3px] rounded-lg sm:rounded-xl border ${isToday ? 'border-[#67E8F9]' : lead ? '' : 'border-white/[0.07]'} ${lead ? '' : 'bg-white/[0.025]'}`;
                  const sty = {
                    opacity: faded ? 0.25 : past && !isToday ? 0.62 : 1,
                    borderColor: lead && !isToday ? `${color}88` : undefined,
                    background: lead ? `linear-gradient(135deg, ${color}33, ${color}0d)` : undefined,
                    ['--fc' as string]: color,
                    boxShadow: isToday ? '0 0 0 1px #67E8F9, 0 0 18px rgba(103,232,249,0.45)' : undefined,
                  };
                  return (
                    <div key={i} className="relative" style={{ aspectRatio: '1' }}>
                      {live ? (
                        <button
                          onClick={() => onSelect(live)}
                          className={`${cls} cursor-pointer text-left fc-click`}
                          style={sty}
                          title={`${short(live)} - click for the briefing`}
                          aria-label={`${MONTHS[cursor.m]} ${day}: ${live.title}`}
                        >{inner}</button>
                      ) : (
                        <div className={cls} style={sty} title={lead ? `✓ ${short(lead)}` : undefined}>{inner}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* flight path + ship */}
              {path && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                  viewBox={`0 0 700 ${rows * 100}`}
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path id={`fp${uid}`} d={path} stroke="#67E8F9" strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" strokeDasharray="10 12" className="fc-dash" />
                  {waypoints.map((p, i) => (
                    <circle key={i} cx={p[0]} cy={p[1]} r="7" fill="#07060F" stroke="#67E8F9" strokeWidth="3" />
                  ))}
                  {!reduce && (
                    <g>
                      <path d="M24,0 L-16,-15 L-7,0 L-16,15 Z" fill="#fff" stroke="#E8572A" strokeWidth="4" strokeLinejoin="round" />
                      <animateMotion dur={`${Math.max(4, waypoints.length * 2.4)}s`} repeatCount="indefinite" rotate="auto">
                        <mpath href={`#fp${uid}`} />
                      </animateMotion>
                    </g>
                  )}
                </svg>
              )}
            </div>
          </div>

          {/* CONSOLE */}
          <div className="lg:col-span-2 min-w-0 p-4 sm:p-6 lg:pl-0 flex flex-col gap-4">
            <div className="rounded-2xl bg-black/40 border border-white/10 p-3 sm:p-4 overflow-hidden font-mono text-[11px] sm:text-xs leading-relaxed">
              <div className="flex items-center justify-between mb-3 text-[10px] tracking-widest uppercase">
                <span style={{ color: tab.color }}>▶ run {tab.file}</span>
                <span className="text-[#A7A3C7]/70">{next ? `T-${days}d` : 'idle'}</span>
              </div>
              <div className="relative">
                {/* invisible full text reserves the height so nothing jumps while typing */}
                <pre aria-hidden="true" className="invisible whitespace-pre-wrap break-words m-0 font-mono">{text}</pre>
                <div className="absolute inset-0 whitespace-pre-wrap break-words" aria-label={text}>
                  {typedLines.map((l, i) => <ConsoleLine key={i} line={l} color={tab.color} />)}
                  {done && <span className="fc-blink text-[#67E8F9]">█</span>}
                </div>
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-[#A7A3C7] mb-2">
                // missions in {MONTHS[cursor.m].slice(0, 3).toLowerCase()} · {monthEvents.length}
              </div>
              <div className="flex flex-col gap-1.5">
                {monthEvents.length === 0 && (
                  <div className="font-mono text-xs text-[#A7A3C7]/80">{'// nothing scheduled. try ▶ next month'}</div>
                )}
                {monthEvents.map((e) => {
                  const past = new Date(e.targetIso).getTime() < now.getTime() - 864e5;
                  return (
                    <button
                      key={e.id}
                      disabled={past}
                      onClick={() => onSelect(e)}
                      className={`flex items-center gap-2.5 text-left px-2.5 py-1.5 rounded-lg font-mono text-xs transition-colors ${past ? 'opacity-60 cursor-default' : 'hover:bg-white/10 cursor-pointer'}`}
                    >
                      <span className="w-6 shrink-0 text-center font-black" style={{ color: e.verticalColor }}>{past ? '✓' : GLYPH[e.vertical]}</span>
                      <span className="text-[#67E8F9] font-bold w-14 shrink-0">{label(new Date(e.targetIso))}</span>
                      <span className="text-[#E6EDF7] truncate">{short(e)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
