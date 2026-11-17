import { type PaddleState, PADDLE_WIDTH } from './paddleGames';
import { type SnakeState, SNAKE_COLUMNS, SNAKE_ROWS } from './snake';

export interface ArcadeScreen {
  view: 'games' | 'snake' | 'pong' | 'breakout';
  snake: SnakeState;
  paddle: PaddleState;
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
    const choices = [
      { title: 'SNAKE', detail: 'Eat, grow, wrap around.', color: '#b5ca93' },
      { title: 'PONG', detail: 'First to five wins.', color: '#b4dbee' },
      { title: 'BREAKOUT', detail: 'Clear all the bricks.', color: '#e9bb89' },
    ];
    choices.forEach((choice, index) => {
      const x = 94 + index * 292;
      ctx.fillStyle = '#071d25';
      ctx.fillRect(x, 220, 252, 355);
      ctx.strokeStyle = choice.color;
      ctx.strokeRect(x + .5, 220.5, 251, 354);
      ctx.fillStyle = choice.color;
      if (index === 0) {
        for (const [cx, cy] of [[0, 0], [1, 0], [2, 0], [2, -1], [3, -1]]) ctx.fillRect(x + 61 + cx * 24, 335 + cy * 24, 21, 21);
        ctx.fillRect(x + 176, 285, 10, 10);
      } else if (index === 1) {
        ctx.fillRect(x + 48, 280, 156, 4);
        ctx.fillRect(x + 48, 360, 156, 4);
        ctx.fillRect(x + 58, 302, 7, 42);
        ctx.fillRect(x + 187, 302, 7, 42);
        ctx.beginPath(); ctx.arc(x + 129, 325, 7, 0, Math.PI * 2); ctx.fill();
      } else {
        for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) ctx.fillRect(x + 35 + col * 37, 280 + row * 18, 32, 12);
        ctx.fillRect(x + 95, 364, 64, 6);
        ctx.beginPath(); ctx.arc(x + 139, 344, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.textAlign = 'center';
      label(choice.title, x + 126, 437, index === 2 ? 28 : 34, choice.color);
      label(choice.detail, x + 126, 477, 15);
      ctx.textAlign = 'left';
      button('PLAY', x + 38, 511, 176);
    });
    ctx.textAlign = 'center';
    label('CHOOSE A GAME', 512, 656, 18);
    ctx.restore();
    return;
  }

  if (arcade.view !== 'snake') {
    const game = arcade.paddle;
    label(game.game.toUpperCase(), 120, 183, 28);
    ctx.textAlign = 'right';
    label(game.game === 'pong' ? `YOU ${game.score} : ${game.opponentScore} CPU` : `SCORE ${game.score} · LIVES ${game.lives}`, 600, 183, 19);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#07131e';
    ctx.fillRect(110, 200, 500, 404);
    ctx.strokeStyle = '#9ed6e866';
    ctx.strokeRect(120, 210, 480, 384);
    ctx.save();
    ctx.translate(120, 210);
    ctx.fillStyle = '#b4dbee';
    ctx.fillRect(game.paddle - PADDLE_WIDTH / 2, 350, PADDLE_WIDTH, 8);
    if (game.game === 'pong') {
      ctx.fillStyle = '#e9bb89';
      ctx.fillRect(game.opponent - PADDLE_WIDTH / 2, 26, PADDLE_WIDTH, 8);
      ctx.fillStyle = '#b4dbee33';
      for (let x = 0; x < 480; x += 20) ctx.fillRect(x, 190, 10, 2);
    } else {
      game.bricks.forEach((alive, index) => {
        if (!alive) return;
        ctx.fillStyle = ['#eaa786', '#e9c489', '#afd4a0', '#9cc8eb'][Math.floor(index / 8)];
        ctx.fillRect(10 + index % 8 * 58, 36 + Math.floor(index / 8) * 26, 54, 20);
      });
    }
    ctx.fillStyle = '#f4eacb';
    ctx.beginPath(); ctx.arc(game.ball.x, game.ball.y, 6, 0, Math.PI * 2); ctx.fill();
    if (game.status !== 'running') {
      ctx.fillStyle = '#07131eec'; ctx.fillRect(20, 128, 440, 130);
      ctx.textAlign = 'center';
      label(game.status === 'ready' ? 'READY?' : game.status === 'paused' ? 'PAUSED' : game.status === 'won' ? 'YOU WIN!' : 'GAME OVER', 240, 180, 32);
      label('ENTER / TAP TO PLAY', 240, 219, 18);
      ctx.textAlign = 'left';
    }
    ctx.restore();
    label('MOVE PADDLE', 738, 254, 21);
    button('←', 712, 368, 56, 56);
    button('→', 844, 368, 56, 56);
    button(game.status === 'running' ? 'PAUSE' : 'PLAY / RESUME', 710, 510, 192);
    button('RESTART', 710, 562, 192);
    button('GAMES', 710, 614, 192);
    label('LEFT / RIGHT · DRAG TO MOVE', 120, 655, 17);
    label('SPACE TO PAUSE', 120, 687, 17);
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
