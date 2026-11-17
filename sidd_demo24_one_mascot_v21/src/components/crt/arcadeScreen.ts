import { type SnakeState, SNAKE_COLUMNS, SNAKE_ROWS } from './snake';

export interface ArcadeScreen {
  view: 'games' | 'snake';
  snake: SnakeState;
}

export function drawGamepad(ctx: CanvasRenderingContext2D, x: number, y: number, size = 32) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 32, size / 32);
  ctx.strokeStyle = '#c5eeee';
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(9, 7);
  ctx.bezierCurveTo(3, 6, 2, 14, 1, 23);
  ctx.bezierCurveTo(1, 29, 6, 29, 11, 22);
  ctx.lineTo(21, 22);
  ctx.bezierCurveTo(26, 29, 31, 29, 31, 23);
  ctx.bezierCurveTo(30, 14, 29, 6, 23, 7);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(7, 15); ctx.lineTo(13, 15);
  ctx.moveTo(10, 12); ctx.lineTo(10, 18);
  ctx.stroke();
  ctx.fillStyle = '#c5eeee';
  for (const [cx, cy] of [[23, 13], [26, 17]]) {
    ctx.beginPath(); ctx.arc(cx, cy, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawArcadeScreen(ctx: CanvasRenderingContext2D, arcade: ArcadeScreen) {
  const ink = '#c5eeee';
  const label = (value: string, x: number, y: number, size = 20, color = ink) => {
    ctx.font = `${size}px monospace`;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  };
  const button = (value: string, x: number, y: number, width: number, height = 40) => {
    ctx.fillStyle = '#0c333e';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#a3dddd77';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y + .5, width - 1, height - 1);
    ctx.textAlign = 'center';
    label(value, x + width / 2, y + height / 2 + 7, 20);
    ctx.textAlign = 'left';
  };
  ctx.save();
  label(arcade.view === 'games' ? '‹ EVENTS' : '‹ GAMES', 72, 106, 23);
  ctx.textAlign = 'right';
  label('B/STACK ARCADE', 950, 106, 20);
  drawGamepad(ctx, 742, 84, 28);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#bce5e544';
  ctx.fillRect(72, 125, 878, 1);

  if (arcade.view === 'games') {
    ctx.fillStyle = '#071d25';
    ctx.fillRect(256, 220, 512, 355);
    ctx.strokeStyle = '#a5dada66';
    ctx.strokeRect(256.5, 220.5, 511, 354);
    ctx.fillStyle = '#a9ba88';
    ctx.fillRect(384, 250, 256, 128);
    ctx.fillStyle = '#243421';
    for (const [x, y] of [[0, 0], [1, 0], [2, 0], [2, -1], [2, -2], [3, -2], [4, -2]]) {
      ctx.fillRect(430 + x * 24, 331 + y * 24, 21, 21);
    }
    ctx.fillRect(574, 283, 12, 12);
    ctx.textAlign = 'center';
    label('SNAKE', 512, 438, 44);
    label('Eat. Grow. Beat your score.', 512, 480, 19);
    ctx.textAlign = 'left';
    button('PLAY SNAKE', 374, 511, 276);
    ctx.textAlign = 'center';
    label('ARROW KEYS / WASD / TOUCH CONTROLS', 512, 656, 18);
    ctx.restore();
    return;
  }

  const { snake } = arcade;
  label('SNAKE', 120, 183, 28);
  ctx.textAlign = 'right';
  label(`SCORE ${String(snake.score).padStart(3, '0')}`, 600, 183, 22);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#a9ba88';
  ctx.fillRect(110, 200, 500, 404);
  ctx.fillStyle = '#26362210';
  for (let x = 0; x < SNAKE_COLUMNS; x++) {
    for (let y = 0; y < SNAKE_ROWS; y++) ctx.fillRect(120 + x * 24, 210 + y * 24, 22, 22);
  }
  ctx.fillStyle = '#273b23';
  snake.body.forEach((cell, index) => {
    ctx.fillRect(121 + cell.x * 24, 211 + cell.y * 24, 22, 22);
    if (index === 0) {
      ctx.fillStyle = '#b8cb99';
      const horizontal = snake.direction === 'left' || snake.direction === 'right';
      const x = 120 + cell.x * 24;
      const y = 210 + cell.y * 24;
      ctx.fillRect(x + (snake.direction === 'right' ? 16 : 5), y + 5, 3, 3);
      ctx.fillRect(x + (horizontal ? (snake.direction === 'right' ? 16 : 5) : 16), y + (horizontal ? 16 : 5), 3, 3);
      ctx.fillStyle = '#273b23';
    }
  });
  if (snake.food) {
    ctx.fillRect(127 + snake.food.x * 24, 217 + snake.food.y * 24, 10, 10);
    ctx.fillRect(133 + snake.food.x * 24, 213 + snake.food.y * 24, 4, 4);
  }
  if (snake.status !== 'running') {
    ctx.fillStyle = '#a9ba88ed';
    ctx.fillRect(146, 328, 428, 136);
    ctx.textAlign = 'center';
    const title = snake.status === 'ready' ? 'READY?' : snake.status === 'paused' ? 'PAUSED' : snake.status === 'won' ? 'YOU WIN!' : 'GAME OVER';
    label(title, 360, 382, 34, '#243421');
    label(snake.status === 'over' || snake.status === 'won' ? 'ENTER / TAP TO PLAY AGAIN' : 'ENTER / TAP TO PLAY', 360, 423, 18, '#243421');
    ctx.textAlign = 'left';
  }
  label('CONTROLS', 746, 254, 21);
  button('↑', 778, 302, 56, 56);
  button('←', 712, 368, 56, 56);
  button('→', 844, 368, 56, 56);
  button('↓', 778, 434, 56, 56);
  button(snake.status === 'running' ? 'PAUSE' : 'PLAY / RESUME', 710, 510, 192);
  button('RESTART', 710, 562, 192);
  button('GAMES', 710, 614, 192);
  label('ARROWS / WASD · SPACE TO PAUSE', 120, 655, 17);
  label('Edges wrap. Avoid your tail.', 120, 687, 17);
  ctx.restore();
}
