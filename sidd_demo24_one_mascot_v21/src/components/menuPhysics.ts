// A tiny 2D rigid-body engine for the falling menu shapes.
//
// Every shape is a rigid body made of one or more overlapping circles ("compound circles"),
// which is plenty for a pile of blobs and keeps the whole thing dependency-free. Bodies
// fall under gravity, bounce a little, spin, rest on the floor and on each other, and can
// be poked by the pointer. Contacts are solved with sequential impulses (normal + friction),
// followed by a gentle positional correction so piles settle without jitter.

export interface CircleDef {
  x: number; // offset from the body centre (px, in the body's own rotation frame)
  y: number;
  r: number;
}

export interface Body {
  id: string;
  x: number;
  y: number;
  a: number; // rotation (rad)
  vx: number;
  vy: number;
  w: number; // angular velocity (rad/s)
  invM: number;
  invI: number;
  circles: CircleDef[];
  reach: number; // bounding radius, for cheap rejection
  delay: number; // seconds until the body is released from above the screen
  live: boolean;
}

interface Contact {
  a: Body | null; // null = static (floor / wall)
  b: Body;
  nx: number;
  ny: number;
  rax: number;
  ray: number;
  rbx: number;
  rby: number;
  pen: number;
  kN: number;
  kT: number;
  bias: number;
  jn: number;
  jt: number;
}

const DENSITY = 1 / 1000;
const RESTITUTION = 0.28;
const FRICTION = 0.55;
const REST_SPEED = 140; // px/s: slower impacts don't bounce
const SUBSTEPS = 3;
const ITERATIONS = 9;

export function makeBody(id: string, circles: CircleDef[]): Body {
  let m = 0;
  let I = 0;
  let reach = 0;
  for (const c of circles) {
    const mi = Math.PI * c.r * c.r * DENSITY;
    m += mi;
    I += mi * (0.5 * c.r * c.r + c.x * c.x + c.y * c.y);
    reach = Math.max(reach, Math.hypot(c.x, c.y) + c.r);
  }
  return { id, x: 0, y: 0, a: 0, vx: 0, vy: 0, w: 0, invM: 1 / m, invI: 1 / I, circles, reach, delay: 0, live: false };
}

export class World {
  bodies: Body[] = [];
  width = 0;
  height = 0;
  floorY = 0;
  hasFloor = true;
  gravity = 2600; // px/s^2
  private contacts: Contact[] = [];
  private calm = new Map<string, number>();

  constructor(width: number, height: number, floorY: number) {
    this.resize(width, height, floorY);
  }

  resize(width: number, height: number, floorY: number) {
    this.width = width;
    this.height = height;
    this.floorY = floorY;
  }

  /** Advance the simulation by dt seconds. */
  step(dt: number) {
    const h = dt / SUBSTEPS;
    for (let i = 0; i < SUBSTEPS; i++) this.sub(h);
  }

  /** Run the simulation to rest without rendering (reduced-motion users get the final pile). */
  settle(seconds: number) {
    const dt = 1 / 60;
    for (let t = 0; t < seconds; t += dt) this.step(dt);
  }

  // ---- grabbing: a shape only moves while the pointer is holding it ----
  grab: { body: Body; lx: number; ly: number; tx: number; ty: number } | null = null;

  /** The shape under a point (or null). */
  pick(px: number, py: number): Body | null {
    let best: Body | null = null;
    let bestD = Infinity;
    for (const b of this.bodies) {
      if (!b.live) continue;
      if (Math.hypot(px - b.x, py - b.y) > b.reach + 10) continue;
      const cos = Math.cos(b.a);
      const sin = Math.sin(b.a);
      for (const c of b.circles) {
        const wx = b.x + c.x * cos - c.y * sin;
        const wy = b.y + c.x * sin + c.y * cos;
        const d = Math.hypot(px - wx, py - wy);
        if (d <= c.r + 6 && d < bestD) {
          bestD = d;
          best = b;
        }
      }
    }
    return best;
  }

  /** Pick a shape up by the point you pressed on. */
  startGrab(b: Body, px: number, py: number) {
    const dx = px - b.x;
    const dy = py - b.y;
    const cos = Math.cos(b.a);
    const sin = Math.sin(b.a);
    this.grab = { body: b, lx: dx * cos + dy * sin, ly: -dx * sin + dy * cos, tx: px, ty: py };
  }

  moveGrab(px: number, py: number) {
    if (!this.grab) return;
    this.grab.tx = px;
    this.grab.ty = py;
  }

  /** Let go. The shape keeps its speed, so a quick flick throws it. */
  endGrab() {
    const g = this.grab;
    this.grab = null;
    if (!g) return;
    const b = g.body;
    const speed = Math.hypot(b.vx, b.vy);
    const max = 2200;
    if (speed > max) {
      b.vx *= max / speed;
      b.vy *= max / speed;
    }
    b.w = Math.max(-9, Math.min(9, b.w));
  }

  /** Let the pointer shove whatever it sweeps through (no longer used by the menu). */
  poke(px: number, py: number, dx: number, dy: number) {
    const k = 1.6;
    const cap = 900;
    for (const b of this.bodies) {
      if (!b.live) continue;
      if (Math.hypot(px - b.x, py - b.y) > b.reach + 12) continue;
      const cos = Math.cos(b.a);
      const sin = Math.sin(b.a);
      let hit = false;
      for (const c of b.circles) {
        const wx = b.x + c.x * cos - c.y * sin;
        const wy = b.y + c.x * sin + c.y * cos;
        if (Math.hypot(px - wx, py - wy) <= c.r + 8) {
          hit = true;
          break;
        }
      }
      if (!hit) continue;
      const ix = Math.max(-cap, Math.min(cap, dx * k * 30));
      const iy = Math.max(-cap, Math.min(cap, dy * k * 30));
      b.vx += ix * 0.5;
      b.vy += iy * 0.5;
      b.w += Math.max(-4, Math.min(4, ((px - b.x) * iy - (py - b.y) * ix) * 0.5 * (b.invI / b.invM)));
    }
  }

  private sub(h: number) {
    const live: Body[] = [];
    for (const b of this.bodies) {
      if (!b.live) {
        b.delay -= h;
        if (b.delay > 0) continue;
        b.live = true;
      }
      b.vy += this.gravity * h;
      b.vx *= 1 / (1 + 0.12 * h);
      b.w *= 1 / (1 + 0.55 * h);
      live.push(b);
    }

    // a held shape is pulled toward the pointer by a damped spring
    const g = this.grab;
    if (g && g.body.live) {
      const b = g.body;
      const cos = Math.cos(b.a);
      const sin = Math.sin(b.a);
      const rx = g.lx * cos - g.ly * sin;
      const ry = g.lx * sin + g.ly * cos;
      const ex = g.tx - (b.x + rx);
      const ey = g.ty - (b.y + ry);
      const ax = 700 * ex - 48 * b.vx;
      const ay = 700 * ey - 48 * b.vy;
      b.vx += ax * h;
      b.vy += ay * h;
      b.w += (rx * ay - ry * ax) * (b.invI / b.invM) * h;
      b.w *= 1 / (1 + 6 * h);
    }

    // velocity constraints
    this.collect(live, false);
    for (const c of this.contacts) this.prepare(c);
    for (let it = 0; it < ITERATIONS; it++) for (const c of this.contacts) this.solve(c);

    // integrate
    for (const b of live) {
      b.x += b.vx * h;
      b.y += b.vy * h;
      b.a += b.w * h;
    }

    // positional correction (keeps piles from sinking into each other)
    this.collect(live, true);
    for (const c of this.contacts) {
      const invSum = (c.a ? c.a.invM : 0) + c.b.invM;
      const corr = (Math.max(c.pen - 0.6, 0) * 0.55) / invSum;
      c.b.x += c.nx * corr * c.b.invM;
      c.b.y += c.ny * corr * c.b.invM;
      if (c.a) {
        c.a.x -= c.nx * corr * c.a.invM;
        c.a.y -= c.ny * corr * c.a.invM;
      }
    }

    // settle: kill the last bit of jitter once a body is nearly still
    for (const b of live) {
      const slow = b.vx * b.vx + b.vy * b.vy < 30 * 30 && Math.abs(b.w) < 0.18;
      const t = slow ? (this.calm.get(b.id) ?? 0) + h : 0;
      this.calm.set(b.id, t);
      if (t > 0.25 && this.hasFloor) {
        b.vx *= 0.8;
        b.vy *= 0.8;
        b.w *= 0.8;
      }
    }
  }

  private collect(live: Body[], forCorrection: boolean) {
    const out = this.contacts;
    out.length = 0;
    const W = this.width;
    for (let i = 0; i < live.length; i++) {
      const A = live[i];
      const cosA = Math.cos(A.a);
      const sinA = Math.sin(A.a);

      for (const c of A.circles) {
        const wx = A.x + c.x * cosA - c.y * sinA;
        const wy = A.y + c.x * sinA + c.y * cosA;
        if (this.hasFloor && wy + c.r > this.floorY) {
          out.push(this.make(null, A, 0, -1, wx, wy + c.r, wy + c.r - this.floorY, forCorrection));
        }
        if (wx - c.r < 0) out.push(this.make(null, A, 1, 0, wx - c.r, wy, c.r - wx, forCorrection));
        if (wx + c.r > W) out.push(this.make(null, A, -1, 0, wx + c.r, wy, wx + c.r - W, forCorrection));
      }

      for (let j = i + 1; j < live.length; j++) {
        const B = live[j];
        const reach = A.reach + B.reach;
        const ddx = B.x - A.x;
        const ddy = B.y - A.y;
        if (ddx * ddx + ddy * ddy > reach * reach) continue;
        const cosB = Math.cos(B.a);
        const sinB = Math.sin(B.a);
        for (const ca of A.circles) {
          const ax = A.x + ca.x * cosA - ca.y * sinA;
          const ay = A.y + ca.x * sinA + ca.y * cosA;
          for (const cb of B.circles) {
            const bx = B.x + cb.x * cosB - cb.y * sinB;
            const by = B.y + cb.x * sinB + cb.y * cosB;
            const dx = bx - ax;
            const dy = by - ay;
            const rr = ca.r + cb.r;
            const d2 = dx * dx + dy * dy;
            if (d2 >= rr * rr) continue;
            const d = Math.sqrt(d2);
            const nx = d > 1e-6 ? dx / d : 0;
            const ny = d > 1e-6 ? dy / d : 1;
            const pen = rr - d;
            out.push(this.make(A, B, nx, ny, ax + nx * (ca.r - pen / 2), ay + ny * (ca.r - pen / 2), pen, forCorrection));
          }
        }
      }
    }
  }

  private make(a: Body | null, b: Body, nx: number, ny: number, px: number, py: number, pen: number, _skip: boolean): Contact {
    return {
      a,
      b,
      nx,
      ny,
      rax: a ? px - a.x : 0,
      ray: a ? py - a.y : 0,
      rbx: px - b.x,
      rby: py - b.y,
      pen,
      kN: 0,
      kT: 0,
      bias: 0,
      jn: 0,
      jt: 0,
    };
  }

  private prepare(c: Contact) {
    const { a, b, nx, ny } = c;
    const tx = -ny;
    const ty = nx;
    const iMa = a ? a.invM : 0;
    const iIa = a ? a.invI : 0;
    const raN = c.rax * ny - c.ray * nx;
    const rbN = c.rbx * ny - c.rby * nx;
    const raT = c.rax * ty - c.ray * tx;
    const rbT = c.rbx * ty - c.rby * tx;
    c.kN = iMa + b.invM + raN * raN * iIa + rbN * rbN * b.invI;
    c.kT = iMa + b.invM + raT * raT * iIa + rbT * rbT * b.invI;
    const vn = this.relVel(c, nx, ny);
    c.bias = vn < -REST_SPEED ? -RESTITUTION * vn : 0;
  }

  private relVel(c: Contact, dx: number, dy: number) {
    const { a, b } = c;
    const vbx = b.vx - b.w * c.rby;
    const vby = b.vy + b.w * c.rbx;
    const vax = a ? a.vx - a.w * c.ray : 0;
    const vay = a ? a.vy + a.w * c.rax : 0;
    return (vbx - vax) * dx + (vby - vay) * dy;
  }

  private apply(c: Contact, px: number, py: number) {
    const { a, b } = c;
    b.vx += px * b.invM;
    b.vy += py * b.invM;
    b.w += (c.rbx * py - c.rby * px) * b.invI;
    if (a) {
      a.vx -= px * a.invM;
      a.vy -= py * a.invM;
      a.w -= (c.rax * py - c.ray * px) * a.invI;
    }
  }

  private solve(c: Contact) {
    // normal
    const vn = this.relVel(c, c.nx, c.ny);
    let jn = (-vn + c.bias) / c.kN;
    const accN = Math.max(c.jn + jn, 0);
    jn = accN - c.jn;
    c.jn = accN;
    this.apply(c, c.nx * jn, c.ny * jn);

    // friction
    const tx = -c.ny;
    const ty = c.nx;
    const vt = this.relVel(c, tx, ty);
    let jt = -vt / c.kT;
    const maxF = FRICTION * c.jn;
    const accT = Math.max(-maxF, Math.min(maxF, c.jt + jt));
    jt = accT - c.jt;
    c.jt = accT;
    this.apply(c, tx * jt, ty * jt);
  }
}
