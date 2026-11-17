export type SnakeDirection = 'up' | 'right' | 'down' | 'left';
export type SnakeStatus = 'ready' | 'running' | 'paused' | 'over' | 'won';
export interface SnakeCell { x: number; y: number }
export interface SnakeState {
  body: SnakeCell[];
  food: SnakeCell | null;
  direction: SnakeDirection;
  nextDirection: SnakeDirection;
  status: SnakeStatus;
  score: number;
}

export const SNAKE_COLUMNS = 20;
export const SNAKE_ROWS = 16;
const vectors: Record<SnakeDirection, SnakeCell> = {
  up: { x: 0, y: -1 }, right: { x: 1, y: 0 },
  down: { x: 0, y: 1 }, left: { x: -1, y: 0 },
};

function placeFood(body: SnakeCell[], random: () => number): SnakeCell | null {
  const empty: SnakeCell[] = [];
  for (let y = 0; y < SNAKE_ROWS; y++) {
    for (let x = 0; x < SNAKE_COLUMNS; x++) {
      if (!body.some(cell => cell.x === x && cell.y === y)) empty.push({ x, y });
    }
  }
  return empty[Math.floor(random() * empty.length)] ?? null;
}

export function createSnake(random = Math.random): SnakeState {
  const body = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
  return { body, food: placeFood(body, random), direction: 'right', nextDirection: 'right', status: 'ready', score: 0 };
}

export function turnSnake(state: SnakeState, direction: SnakeDirection): SnakeState {
  if (state.status === 'over' || state.status === 'won') return state;
  const current = vectors[state.direction];
  const next = vectors[direction];
  // Compare against the last completed move, even when several keys arrive in one tick.
  if (current.x + next.x === 0 && current.y + next.y === 0) return state;
  return { ...state, nextDirection: direction };
}

export function stepSnake(state: SnakeState, random = Math.random): SnakeState {
  if (state.status !== 'running') return state;
  const vector = vectors[state.nextDirection];
  const head = { x: state.body[0].x + vector.x, y: state.body[0].y + vector.y };
  const eating = head.x === state.food?.x && head.y === state.food?.y;
  const occupied = eating ? state.body : state.body.slice(0, -1);
  if (head.x < 0 || head.x >= SNAKE_COLUMNS || head.y < 0 || head.y >= SNAKE_ROWS ||
    occupied.some(cell => cell.x === head.x && cell.y === head.y)) {
    return { ...state, status: 'over' };
  }
  const body = [head, ...state.body];
  if (!eating) body.pop();
  const food = eating ? placeFood(body, random) : state.food;
  return { ...state, body, food, direction: state.nextDirection, score: state.score + (eating ? 10 : 0),
    status: food === null ? 'won' : 'running' };
}

export type ArcadeAction = SnakeDirection | 'play' | 'pause' | 'restart' | 'games' | 'events';

export function arcadeActionAt(x: number, y: number, view: 'games' | 'snake'): ArcadeAction | null {
  if (y < .20 && x < .4) return view === 'snake' ? 'games' : 'events';
  if (view === 'games') return x >= .25 && x <= .75 && y >= .28 && y <= .78 ? 'play' : null;
  const px = x * 1024;
  const py = y * 768;
  if (px >= 120 && px <= 600 && py >= 210 && py <= 594) return 'play';
  if (Math.abs(px - 806) <= 28 && Math.abs(py - 330) <= 28) return 'up';
  if (Math.abs(px - 740) <= 28 && Math.abs(py - 396) <= 28) return 'left';
  if (Math.abs(px - 872) <= 28 && Math.abs(py - 396) <= 28) return 'right';
  if (Math.abs(px - 806) <= 28 && Math.abs(py - 462) <= 28) return 'down';
  if (px >= 710 && px <= 902) {
    if (py >= 510 && py <= 550) return 'pause';
    if (py >= 562 && py <= 602) return 'restart';
    if (py >= 614 && py <= 654) return 'games';
  }
  return null;
}
