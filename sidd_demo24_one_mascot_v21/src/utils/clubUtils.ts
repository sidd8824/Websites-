/**
 * Pure calculation utilities for B/Stack
 * Used for deterministic logic, unit testing, countdowns, sphere math, and scroll color interpolation.
 */

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  dd: string;
  hh: string;
  mm: string;
  ss: string;
  isLive: boolean;
  isPast: boolean;
  totalSeconds: number;
}

export function computeCountdown(targetIso: string, nowInput?: string | number | Date): CountdownResult {
  const target = new Date(targetIso).getTime();
  const now = nowInput ? new Date(nowInput).getTime() : Date.now();
  const diffMs = target - now;

  if (isNaN(diffMs)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      dd: '00',
      hh: '00',
      mm: '00',
      ss: '00',
      isLive: false,
      isPast: true,
      totalSeconds: 0,
    };
  }

  // If within 24 hours after target, it is "LIVE NOW"
  if (diffMs <= 0 && diffMs >= -86400000) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      dd: '00',
      hh: '00',
      mm: '00',
      ss: '00',
      isLive: true,
      isPast: false,
      totalSeconds: 0,
    };
  }

  if (diffMs < -86400000) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      dd: '00',
      hh: '00',
      mm: '00',
      ss: '00',
      isLive: false,
      isPast: true,
      totalSeconds: 0,
    };
  }

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    dd: String(days).padStart(2, '0'),
    hh: String(hours).padStart(2, '0'),
    mm: String(minutes).padStart(2, '0'),
    ss: String(seconds).padStart(2, '0'),
    isLive: false,
    isPast: false,
    totalSeconds,
  };
}

export interface SpherePoint {
  x: number;
  y: number;
  z: number;
  index: number;
}

export function getFibonacciSpherePoints(count: number, radius: number): SpherePoint[] {
  const points: SpherePoint[] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const goldenAngle = 2 * Math.PI * (1 - 1 / goldenRatio);

  for (let i = 0; i < count; i++) {
    // Normalised latitude from 1 to -1
    const y = 1 - (i / (count - 1 || 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    points.push({
      x: x * radius,
      y: y * radius,
      z: z * radius,
      index: i,
    });
  }

  return points;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (isNaN(bigint)) return { r: 5, g: 7, b: 13 };
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const f = Math.max(0, Math.min(1, factor));
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  return rgbToHex(
    c1.r + (c2.r - c1.r) * f,
    c1.g + (c2.g - c1.g) * f,
    c1.b + (c2.b - c1.b) * f
  );
}

export interface ScrollBackgroundState {
  colorStart: string;
  colorEnd: string;
  glowColor?: string;
  glowOpacity?: number;
}

const GRADIENT_STOPS: { progress: number; start: string; end: string; glowColor?: string; glowOpacity?: number }[] = [
  { progress: 0.0, start: '#0B0A16', end: '#1A1240', glowColor: '#8B5CF6', glowOpacity: 0.22 },
  { progress: 0.15, start: '#0B0A16', end: '#231452', glowColor: '#8B5CF6', glowOpacity: 0.25 },
  { progress: 0.3, start: '#0C0B1A', end: '#2A1250', glowColor: '#F472B6', glowOpacity: 0.2 },
  { progress: 0.45, start: '#0D0C1E', end: '#12264A', glowColor: '#22D3EE', glowOpacity: 0.2 },
  { progress: 0.6, start: '#0B0A16', end: '#1E1450', glowColor: '#8B5CF6', glowOpacity: 0.22 },
  { progress: 0.72, start: '#0C0B1A', end: '#2B1048', glowColor: '#F472B6', glowOpacity: 0.2 },
  { progress: 0.85, start: '#0D0C1E', end: '#0F2A4A', glowColor: '#22D3EE', glowOpacity: 0.22 },
  { progress: 0.95, start: '#0B0A16', end: '#231452', glowColor: '#8B5CF6', glowOpacity: 0.25 },
  { progress: 1.0, start: '#0B0A16', end: '#0B0A16' },
];

export function getBackgroundGradientForScroll(progress: number): ScrollBackgroundState {
  const p = Math.max(0, Math.min(1, progress));

  let prev = GRADIENT_STOPS[0];
  let next = GRADIENT_STOPS[1];

  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    if (p >= GRADIENT_STOPS[i].progress && p <= GRADIENT_STOPS[i + 1].progress) {
      prev = GRADIENT_STOPS[i];
      next = GRADIENT_STOPS[i + 1];
      break;
    }
  }

  const range = next.progress - prev.progress;
  const factor = range <= 0 ? 0 : (p - prev.progress) / range;

  const colorStart = interpolateColor(prev.start, next.start, factor);
  const colorEnd = interpolateColor(prev.end, next.end, factor);

  let glowColor = prev.glowColor || next.glowColor;
  let glowOpacity = 0;
  if (prev.glowOpacity !== undefined || next.glowOpacity !== undefined) {
    const oPrev = prev.glowOpacity ?? 0;
    const oNext = next.glowOpacity ?? 0;
    glowOpacity = oPrev + (oNext - oPrev) * factor;
  }

  return {
    colorStart,
    colorEnd,
    glowColor,
    glowOpacity,
  };
}

export function filterTeamMembers<T extends { verticals: string[] }>(members: T[], filter: string): T[] {
  if (filter === 'ALL' || !filter) return members;
  return members.filter((m) => m.verticals.includes(filter));
}

export function filterProjects<T extends { vertical: string }>(projects: T[], filter: string): T[] {
  if (filter === 'ALL' || !filter) return projects;
  return projects.filter((p) => p.vertical === filter);
}

export interface ClubEventData {
  id: string;
  title: string;
  vertical: 'B/Algo' | 'B/Uild' | 'B/Hack' | 'B/Dev' | 'All';
  verticalColor: string;
  dateStr: string;
  targetIso: string;
  location: string;
  note: string;
  isHeroNextMission?: boolean;
  status: 'upcoming' | 'live' | 'completed';
  registrationUrl?: string;
  missionNumber?: string;
  link?: string;
  description?: string;
}

export interface EventScheduleResult<T extends ClubEventData = ClubEventData> {
  heroEvent: T;
  upcomingEvents: T[];
  completedEvents: T[];
}

export function categorizeEvents<T extends ClubEventData>(
  events: T[],
  nowInput?: string | number | Date
): EventScheduleResult<T> {
  const now = nowInput ? new Date(nowInput).getTime() : Date.now();

  const completed: T[] = [];
  const futureOrLive: T[] = [];

  for (const event of events) {
    const eventTime = new Date(event.targetIso).getTime();
    const diff = eventTime - now;

    // More than 24 hours past, or manually completed with past target date
    if (diff < -86400000 || (event.status === 'completed' && diff < 0)) {
      completed.push({
        ...event,
        status: 'completed',
      });
    } else {
      futureOrLive.push({
        ...event,
        status: diff <= 0 ? 'live' : 'upcoming',
      });
    }
  }

  // Nearest future event first
  futureOrLive.sort((a, b) => new Date(a.targetIso).getTime() - new Date(b.targetIso).getTime());

  // Past events ordered with most recent first
  completed.sort((a, b) => new Date(b.targetIso).getTime() - new Date(a.targetIso).getTime());

  const heroEvent = futureOrLive[0] || completed[0] || events[0];
  const upcomingEvents = futureOrLive.slice(1);

  return {
    heroEvent,
    upcomingEvents,
    completedEvents: completed,
  };
}

export type TrailParticleType = 'clock' | 'digit' | 'word' | 'sparkle';

export interface TrailParticle {
  id: number;
  x: number;
  y: number;
  type: TrailParticleType;
  text?: string;
  color: string;
  rotation: number;
  driftX: number;
  createdAt: number;
}

const TRAIL_COLORS = ['#DDEB6B', '#22d3ee', '#F0997B'];
const TRAIL_DIGITS = ['3', '2', '1', '00'];
const TRAIL_WORDS = ['tick', 'tock'];

export function createTrailParticle(
  x: number,
  y: number,
  id: number = Math.random(),
  now: number = Date.now(),
  randomFn = Math.random
): TrailParticle {
  const types: TrailParticleType[] = ['clock', 'digit', 'word', 'sparkle'];
  const type = types[Math.floor(randomFn() * types.length)];
  const color = TRAIL_COLORS[Math.floor(randomFn() * TRAIL_COLORS.length)];
  const driftX = (randomFn() - 0.5) * 30; // -15 to +15px drift
  const rotation = (randomFn() - 0.5) * 50; // -25 to +25 deg

  let text: string | undefined;
  if (type === 'digit') {
    text = TRAIL_DIGITS[Math.floor(randomFn() * TRAIL_DIGITS.length)];
  } else if (type === 'word') {
    text = TRAIL_WORDS[Math.floor(randomFn() * TRAIL_WORDS.length)];
  }

  return {
    id,
    x,
    y,
    type,
    text,
    color: type === 'sparkle' ? '#DDEB6B' : color,
    rotation,
    driftX,
    createdAt: now,
  };
}

export interface TerminalResponse {
  output: string;
  status: 'ok' | 'error' | 'success';
}

export function runTerminalCommand(rawCmd: string): TerminalResponse {
  const cmd = rawCmd.trim().toLowerCase();

  if (!cmd) {
    return { output: '', status: 'ok' };
  }

  if (cmd === 'help') {
    return {
      output: 'Available commands: build, deploy, git status, stack, stats, clear',
      status: 'ok',
    };
  }

  if (cmd === 'build') {
    return {
      output: '⚡ Compiling TypeScript modules... Built in 18ms. 0 errors, bundle size: 142 kB.',
      status: 'success',
    };
  }

  if (cmd === 'deploy') {
    return {
      output: '🚀 Edge deployment complete! Live across 32 regional edge datacenters in 240ms.',
      status: 'success',
    };
  }

  if (cmd.startsWith('git')) {
    return {
      output: 'On branch main. Your branch is up to date with origin/main. 112 PRs merged this season.',
      status: 'ok',
    };
  }

  if (cmd === 'stack') {
    return {
      output: 'Architecture: React 19 · Vite · Three.js WebGL · Tailwind CSS · TypeScript · Rust OSS',
      status: 'ok',
    };
  }

  if (cmd === 'stats') {
    return {
      output: 'System: 140+ builders · 4 verticals · 42 shipped projects · 28 hackathons',
      status: 'ok',
    };
  }

  return {
    output: `bash: command not found: ${rawCmd}. Type "help" for valid commands.`,
    status: 'error',
  };
}

export const MOONSHOT_IDEAS = [
  'Autonomous AI LiDAR rover that delivers pizza across campus lawns at 2 AM',
  'Decentralized peer-to-peer Wi-Fi mesh network for outdoor college music festivals',
  'Real-time WebAssembly compiler running inside a 5-gram wearable ESP32 wristwatch',
  'Computer vision referee that tracks drone agility obstacle times with sub-millisecond lasers',
  'Zero-knowledge proof attendance verifying classroom entry with sub-GHz LoRa packets',
];

export function generateMoonshotIdea(seed?: number): string {
  const idx = seed !== undefined ? seed % MOONSHOT_IDEAS.length : Math.floor(Math.random() * MOONSHOT_IDEAS.length);
  return MOONSHOT_IDEAS[idx];
}

export function solveGridBfs(
  grid: number[][],
  start: [number, number] = [0, 0],
  end: [number, number] = [4, 4]
): [number, number][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue: [number, number][] = [start];
  const visited = new Set<string>();
  const parent = new Map<string, string>();

  visited.add(`${start[0]},${start[1]}`);

  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === end[0] && c === end[1]) {
      // Reconstruct path
      const path: [number, number][] = [];
      let curr = `${end[0]},${end[1]}`;
      while (curr) {
        const [cr, cc] = curr.split(',').map(Number);
        path.unshift([cr, cc]);
        curr = parent.get(curr) || '';
      }
      return path;
    }

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        grid[nr][nc] === 0 &&
        !visited.has(key)
      ) {
        visited.add(key);
        parent.set(key, `${r},${c}`);
        queue.push([nr, nc]);
      }
    }
  }

  return [];
}


