import test from 'node:test';
import assert from 'node:assert/strict';
import { createSnake, stepSnake, turnSnake, arcadeActionAt, type SnakeState } from './snake.ts';

test('Snake grows and scores when eating, and food stays off its body', () => {
  const state: SnakeState = { ...createSnake(), status: 'running', food: { x: 9, y: 8 } };
  const next = stepSnake(state, () => 0);
  assert.equal(next.body.length, 4);
  assert.equal(next.score, 10);
  assert(!next.body.some(cell => cell.x === next.food?.x && cell.y === next.food?.y));
  assert.equal(state.body.length, 3);
});

test('queued turns cannot reverse the last completed direction', () => {
  const state = turnSnake(createSnake(), 'up');
  assert.equal(turnSnake(state, 'left').nextDirection, 'up');
  assert.deepEqual(stepSnake({ ...state, status: 'running' }).body[0], { x: 8, y: 7 });
});

test('walls and occupied body cells end the game', () => {
  const wall: SnakeState = { ...createSnake(), status: 'running', body: [{ x: 19, y: 8 }] };
  assert.equal(stepSnake(wall).status, 'over');
  const body: SnakeState = { ...createSnake(), status: 'running', direction: 'up', nextDirection: 'left',
    body: [{ x: 2, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 3 }] };
  assert.equal(stepSnake(body).status, 'over');
});

test('the tail cell is free on a non-growing move and paused games stay still', () => {
  const state: SnakeState = { ...createSnake(), status: 'running', direction: 'up', nextDirection: 'left',
    body: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }] };
  assert.equal(stepSnake(state).status, 'running');
  const paused: SnakeState = { ...state, status: 'paused' };
  assert.equal(stepSnake(paused), paused);
});

test('filling the board wins without trying to spawn more food', () => {
  const body = [{ x: 1, y: 0 }];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 20; x++) {
    if (y !== 0 || x > 1) body.push({ x, y });
  }
  const state: SnakeState = { ...createSnake(), body, food: { x: 0, y: 0 }, direction: 'up', nextDirection: 'left', status: 'running' };
  const next = stepSnake(state);
  assert.equal(next.status, 'won');
  assert.equal(next.food, null);
  assert.equal(next.body.length, 320);
});

test('canvas menu, direction and restart hit areas resolve to game actions', () => {
  assert.equal(arcadeActionAt(.5, .5, 'games'), 'play');
  assert.equal(arcadeActionAt(806 / 1024, 330 / 768, 'snake'), 'up');
  assert.equal(arcadeActionAt(800 / 1024, 580 / 768, 'snake'), 'restart');
  assert.equal(arcadeActionAt(.15, .13, 'snake'), 'games');
});
