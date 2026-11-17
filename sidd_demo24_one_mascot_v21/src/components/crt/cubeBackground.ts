// Canvas adaptation of the supplied React Bits Cubes reference.
// Original interaction inspired by Can Tastemel's work for lambda.ai (cantastemel.com).
// Drawing into the monitor's existing texture keeps the cubes under its artwork and glass.

interface Point { x: number; y: number }
interface Vertex extends Point { z: number }
const COLUMNS = 12;
const ROWS = 9;
const CELL = 80;
const FACES = [
  [0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1],
  [3, 2, 6, 7], [0, 3, 7, 4], [1, 5, 6, 2],
];
const VERTICES: Vertex[] = [
  { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
  { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
  { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 },
];

export function createCubeBackground() {
  const cubes = Array.from({ length: COLUMNS * ROWS }, (_, index) => ({
    x: 72 + index % COLUMNS * CELL,
    y: 64 + Math.floor(index / COLUMNS) * CELL,
    rx: 0, ry: 0, vx: 0, vy: 0,
  }));
  let pointer: Point | null = null;
  let pointerTime = -Infinity;
  let clock = 0;
  let lastTime: number | undefined;
  const rings: { x: number; y: number; born: number }[] = [];

  return {
    point(uv: Point | null) {
      pointer = uv ? { x: uv.x * 1024, y: uv.y * 768 } : null;
      pointerTime = clock;
    },
    ripple(uv: Point) {
      rings.push({ x: uv.x * 1024, y: uv.y * 768, born: clock });
      if (rings.length > 4) rings.shift();
    },
    draw(ctx: CanvasRenderingContext2D, seconds: number, reducedMotion: boolean) {
      const dt = lastTime === undefined ? 1 / 30 : Math.min(.04, Math.max(0, seconds - lastTime));
      lastTime = seconds;
      if (!reducedMotion) clock += dt;
      if (reducedMotion) rings.length = 0;
      while (rings.length && clock - rings[0].born > 2) rings.shift();
      const cursor = pointer && clock - pointerTime < 3 ? pointer : {
        x: 512 + Math.sin(clock * .37) * 310,
        y: 384 + Math.cos(clock * .43) * 230,
      };
      ctx.save();
      ctx.lineWidth = .8;
      for (const cube of cubes) {
        const dx = (cube.x - cursor.x) / CELL;
        const dy = (cube.y - cursor.y) / CELL;
        const distance = Math.hypot(dx, dy);
        const influence = Math.max(0, 1 - (distance / 3) ** 2) ** 2;
        const targetX = reducedMotion ? .08 : dy * .32 * influence;
        const targetY = reducedMotion ? -.10 : -dx * .32 * influence;
        let flash = 0;
        for (const ring of rings) {
          const reach = Math.hypot(cube.x - ring.x, cube.y - ring.y);
          const radius = (clock - ring.born) * 480;
          const wave = Math.exp(-(((reach - radius) / 45) ** 2)) * Math.exp(-reach / 800);
          flash = Math.max(flash, wave);
        }
        if (reducedMotion) {
          cube.rx = targetX;
          cube.ry = targetY;
          cube.vx = cube.vy = 0;
        } else {
          cube.vx += (105 * (targetX - cube.rx) - 13 * cube.vx) * dt;
          cube.vy += (105 * (targetY - cube.ry) - 13 * cube.vy) * dt;
          cube.rx += cube.vx * dt;
          cube.ry += cube.vy * dt;
        }
        const introDelay = Math.hypot(cube.x - 512, cube.y - 384) / 1400;
        const intro = reducedMotion ? 1 : Math.max(0, Math.min(1, (clock - introDelay) / .9));
        const size = (1 - (1 - intro) ** 3) * CELL * .34;
        const rx = cube.rx + (1 - intro) * 1.2 + flash * .18;
        const ry = cube.ry + flash * .15;
        const vertices = VERTICES.map(vertex => {
          const y = vertex.y * Math.cos(rx) - vertex.z * Math.sin(rx);
          const z = vertex.y * Math.sin(rx) + vertex.z * Math.cos(rx);
          return {
            x: (vertex.x * Math.cos(ry) + z * Math.sin(ry)) * size,
            y: y * size,
            z: (-vertex.x * Math.sin(ry) + z * Math.cos(ry)) * size,
          };
        });
        const faces = FACES.map(indices => ({ indices,
          depth: indices.reduce((sum, index) => sum + vertices[index].z, 0) / 4,
        })).sort((a, b) => a.depth - b.depth);
        for (const face of faces) {
          ctx.beginPath();
          face.indices.forEach((index, corner) => {
            const vertex = vertices[index];
            if (corner === 0) ctx.moveTo(cube.x + vertex.x, cube.y + vertex.y);
            else ctx.lineTo(cube.x + vertex.x, cube.y + vertex.y);
          });
          ctx.closePath();
          const light = Math.max(0, face.depth / Math.max(1, size));
          ctx.fillStyle = `rgba(5, ${22 + light * 7}, ${30 + light * 9}, .82)`;
          ctx.fill();
          ctx.strokeStyle = `rgba(101, 184, 193, ${.14 + light * .08 + flash * .36})`;
          ctx.stroke();
        }
      }
      ctx.restore();
    },
  };
}
