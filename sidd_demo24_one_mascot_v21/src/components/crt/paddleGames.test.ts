import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaddleGame, movePaddle, stepPaddleGame, type PaddleState } from './paddleGames.ts';

test('paddles stay inside the board and paused games stay still', () => {
  const state = createPaddleGame('pong');
  assert.equal(movePaddle(state, -100).paddle, 44);
  assert.equal(movePaddle(state, 900).paddle, 436);
  assert.equal(stepPaddleGame(state, .02), state);
});

test('balls rebound off side walls and the player paddle', () => {
  const state: PaddleState = { ...createPaddleGame('pong'), status: 'running',
    ball: { x: 474, y: 200, vx: 120, vy: -210 } };
  assert(stepPaddleGame(state, .02).ball.vx < 0);
  const paddleHit = { ...state, ball: { x: 240, y: 342, vx: 0, vy: 210 } };
  assert(stepPaddleGame(paddleHit, .02).ball.vy < 0);
  assert.equal(paddleHit.ball.vy, 210);
});

test('Pong awards points and ends at five', () => {
  const state: PaddleState = { ...createPaddleGame('pong'), status: 'running', score: 4,
    ball: { x: 100, y: -5, vx: 0, vy: -210 } };
  const won = stepPaddleGame(state, .02);
  assert.equal(won.score, 5);
  assert.equal(won.status, 'won');
  const missed: PaddleState = { ...state, score: 0, opponentScore: 4, ball: { x: 100, y: 390, vx: 0, vy: 210 } };
  assert.equal(stepPaddleGame(missed, .02).status, 'over');
});

test('Breakout removes a hit brick once and scores', () => {
  const state: PaddleState = { ...createPaddleGame('breakout'), status: 'running',
    ball: { x: 30, y: 60, vx: 0, vy: -210 } };
  const next = stepPaddleGame(state, .02);
  assert.equal(next.score, 10);
  assert.equal(next.bricks[0], false);
  assert.equal(state.bricks[0], true);
  assert(next.ball.vy > 0);
});

test('Breakout serves again after a miss and ends after three misses', () => {
  const state: PaddleState = { ...createPaddleGame('breakout'), status: 'running',
    ball: { x: 40, y: 391, vx: 0, vy: 210 } };
  const next = stepPaddleGame(state, .02);
  assert.equal(next.lives, 2);
  assert.equal(next.status, 'ready');
  assert.equal(stepPaddleGame({ ...state, lives: 1 }, .02).status, 'over');
});

test('clearing the last brick wins Breakout', () => {
  const state: PaddleState = { ...createPaddleGame('breakout'), status: 'running',
    bricks: Array.from({ length: 32 }, (_, index) => index === 0),
    ball: { x: 30, y: 60, vx: 0, vy: -210 } };
  assert.equal(stepPaddleGame(state, .02).status, 'won');
});
