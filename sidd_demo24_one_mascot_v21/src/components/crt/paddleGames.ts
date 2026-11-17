export type PaddleGame = 'pong' | 'breakout';
export type PaddleStatus = 'ready' | 'running' | 'paused' | 'over' | 'won';
export interface PaddleState {
  game: PaddleGame;
  status: PaddleStatus;
  paddle: number;
  opponent: number;
  ball: { x: number; y: number; vx: number; vy: number };
  bricks: boolean[];
  score: number;
  opponentScore: number;
  lives: number;
}
export const BOARD_WIDTH = 480;
export const BOARD_HEIGHT = 384;
export const PADDLE_WIDTH = 88;
export const BALL_RADIUS = 6;

export function createPaddleGame(game: PaddleGame): PaddleState {
  return { game, status: 'ready', paddle: 240, opponent: 240,
    ball: { x: 240, y: 330, vx: 115, vy: -210 },
    bricks: Array(32).fill(true), score: 0, opponentScore: 0, lives: 3 };
}

export function movePaddle(state: PaddleState, x: number): PaddleState {
  return { ...state, paddle: Math.max(PADDLE_WIDTH / 2, Math.min(BOARD_WIDTH - PADDLE_WIDTH / 2, x)) };
}

export function stepPaddleGame(state: PaddleState, dt: number): PaddleState {
  if (state.status !== 'running') return state;
  const seconds = Math.min(.025, Math.max(0, dt));
  const ball = { ...state.ball };
  const previousY = ball.y;
  ball.x += ball.vx * seconds;
  ball.y += ball.vy * seconds;
  if (ball.x < BALL_RADIUS || ball.x > BOARD_WIDTH - BALL_RADIUS) {
    ball.x = Math.max(BALL_RADIUS, Math.min(BOARD_WIDTH - BALL_RADIUS, ball.x));
    ball.vx *= -1;
  }
  let opponent = state.opponent;
  if (state.game === 'pong') {
    const delta = Math.max(-150 * seconds, Math.min(150 * seconds, ball.x - opponent));
    opponent = Math.max(44, Math.min(436, opponent + delta));
    if (ball.vy < 0 && previousY >= 40 && ball.y <= 40 && Math.abs(ball.x - opponent) <= 50) {
      ball.y = 40;
      ball.vy = Math.abs(ball.vy);
      ball.vx = (ball.x - opponent) * 4;
    }
    if (ball.y < -BALL_RADIUS || ball.y > BOARD_HEIGHT + BALL_RADIUS) {
      const score = state.score + (ball.y < 0 ? 1 : 0);
      const opponentScore = state.opponentScore + (ball.y > BOARD_HEIGHT ? 1 : 0);
      return { ...state, score, opponentScore, opponent,
        status: score >= 5 ? 'won' : opponentScore >= 5 ? 'over' : 'ready',
        ball: { x: state.paddle, y: 330, vx: 115, vy: -210 } };
    }
  } else if (ball.y < BALL_RADIUS) {
    ball.y = BALL_RADIUS;
    ball.vy = Math.abs(ball.vy);
  }
  // Only bounce when the ball crosses the paddle from above, avoiding repeated contacts.
  if (ball.vy > 0 && previousY <= 344 && ball.y >= 344 && Math.abs(ball.x - state.paddle) <= 50) {
    ball.y = 344;
    ball.vy = -Math.abs(ball.vy);
    ball.vx = (ball.x - state.paddle) * 4.6;
  }
  let bricks = state.bricks;
  let score = state.score;
  if (state.game === 'breakout') {
    const hit = state.bricks.findIndex((alive, index) => {
      const x = 10 + index % 8 * 58;
      const y = 36 + Math.floor(index / 8) * 26;
      return alive && ball.x + BALL_RADIUS >= x && ball.x - BALL_RADIUS <= x + 54 &&
        ball.y + BALL_RADIUS >= y && ball.y - BALL_RADIUS <= y + 20;
    });
    if (hit >= 0) {
      bricks = state.bricks.slice();
      bricks[hit] = false;
      ball.vy *= -1;
      score += 10;
      if (!bricks.some(Boolean)) return { ...state, ball, bricks, score, status: 'won' };
    }
    if (ball.y > BOARD_HEIGHT + BALL_RADIUS) {
      const lives = state.lives - 1;
      return { ...state, lives, bricks, score, status: lives === 0 ? 'over' : 'ready',
        ball: { x: state.paddle, y: 330, vx: 115, vy: -210 } };
    }
  }
  return { ...state, ball, opponent, bricks, score };
}
