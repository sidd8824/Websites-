import { useEffect, useRef } from 'react';

// Animated space backdrop for the whole site:
//  - a 3D starfield you fly through; it speeds up (warp streaks) while you scroll
//  - occasional shooting stars
//  - a rocket that arrives from far away, grows as it gets closer, and flies past
// Plain 2D canvas, ~180 stars: very light.

type Star = { x: number; y: number; z: number; tw: number; tint: number };
type Rocket = { t: number; dur: number; sx: number; sy: number; ex: number; ey: number };
type Shooter = { x: number; y: number; vx: number; vy: number; life: number };

const TINTS = ['255,255,255', '186,230,253', '221,214,254', '253,230,138'];

export default function SpaceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let rocket: Rocket | null = null;
    let nextRocketAt = performance.now() + 2500; // first rocket shortly after load
    const shooters: Shooter[] = [];
    let nextShooterAt = performance.now() + 4000;
    let lastY = window.scrollY;
    let vel = 0; // smoothed scroll speed
    let raf = 0;
    let last = performance.now();

    const makeStar = (z = Math.random()): Star => ({
      x: (Math.random() * 2 - 1) * 1.6,
      y: (Math.random() * 2 - 1) * 1.6,
      z: Math.max(0.03, z),
      tw: Math.random() * Math.PI * 2,
      tint: Math.floor(Math.random() * TINTS.length),
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 768 ? 90 : 180;
      stars = Array.from({ length: n }, () => makeStar());
    };
    resize();
    window.addEventListener('resize', resize);

    // Rocket drawn in a unit box ~ 1 wide x 2.4 tall, nose pointing up (-y), origin at its centre.
    const drawRocket = (flicker: number) => {
      // flame
      const fl = 0.9 + flicker * 0.7;
      const flame = ctx.createLinearGradient(0, 1.1, 0, 1.1 + fl);
      flame.addColorStop(0, 'rgba(253,224,71,0.95)');
      flame.addColorStop(0.5, 'rgba(249,115,22,0.8)');
      flame.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(-0.28, 1.1);
      ctx.quadraticCurveTo(0, 1.1 + fl * 1.2, 0.28, 1.1);
      ctx.closePath();
      ctx.fill();
      // fins
      ctx.fillStyle = '#8B5CF6';
      ctx.beginPath();
      ctx.moveTo(-0.45, 0.35);
      ctx.lineTo(-0.95, 1.2);
      ctx.lineTo(-0.45, 1.0);
      ctx.closePath();
      ctx.moveTo(0.45, 0.35);
      ctx.lineTo(0.95, 1.2);
      ctx.lineTo(0.45, 1.0);
      ctx.closePath();
      ctx.fill();
      // body
      ctx.fillStyle = '#E6EDF7';
      ctx.beginPath();
      ctx.moveTo(0, -1.3);
      ctx.bezierCurveTo(0.7, -0.6, 0.55, 0.6, 0.45, 1.1);
      ctx.lineTo(-0.45, 1.1);
      ctx.bezierCurveTo(-0.55, 0.6, -0.7, -0.6, 0, -1.3);
      ctx.closePath();
      ctx.fill();
      // nose tint
      ctx.fillStyle = '#6D28D9';
      ctx.beginPath();
      ctx.moveTo(0, -1.3);
      ctx.bezierCurveTo(0.3, -1.0, 0.4, -0.7, 0.45, -0.6);
      ctx.lineTo(-0.45, -0.6);
      ctx.bezierCurveTo(-0.4, -0.7, -0.3, -1.0, 0, -1.3);
      ctx.closePath();
      ctx.fill();
      // window
      ctx.fillStyle = '#67E8F9';
      ctx.beginPath();
      ctx.arc(0, -0.1, 0.22, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // scroll speed -> warp amount
      const y = window.scrollY;
      const dy = Math.abs(y - lastY);
      lastY = y;
      vel += (Math.min(dy, 220) - vel) * (1 - Math.exp(-dt * 8));
      const warp = vel / 220; // 0..1

      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const focal = Math.max(w, h) * 0.55;
      const drift = reduce ? 0 : 0.012 + warp * 0.55; // z units per second

      for (const s of stars) {
        const zPrev = s.z;
        s.z -= drift * dt;
        if (s.z < 0.03) {
          Object.assign(s, makeStar(1));
          continue;
        }
        s.tw += dt * 2;
        const sx = cx + (s.x / s.z) * focal * 0.5;
        const sy = cy + (s.y / s.z) * focal * 0.5;
        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) {
          Object.assign(s, makeStar(1));
          continue;
        }
        const depth = 1 - s.z;
        const alpha = Math.min(1, (0.15 + depth * 0.9) * (0.75 + 0.25 * Math.sin(s.tw)));
        const size = 0.4 + depth * 1.8;
        ctx.fillStyle = `rgba(${TINTS[s.tint]},${alpha})`;
        if (warp > 0.08) {
          // streak from where the star was a moment ago
          const px = cx + (s.x / (zPrev + drift * 0.05)) * focal * 0.5;
          const py = cy + (s.y / (zPrev + drift * 0.05)) * focal * 0.5;
          ctx.strokeStyle = `rgba(${TINTS[s.tint]},${alpha * 0.8})`;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduce) {
        // shooting stars
        if (now > nextShooterAt) {
          const fromLeft = Math.random() < 0.5;
          shooters.push({
            x: fromLeft ? Math.random() * w * 0.4 : w * (0.6 + Math.random() * 0.4),
            y: Math.random() * h * 0.35,
            vx: (fromLeft ? 1 : -1) * (500 + Math.random() * 300),
            vy: 220 + Math.random() * 160,
            life: 1,
          });
          nextShooterAt = now + 5000 + Math.random() * 7000;
        }
        for (let i = shooters.length - 1; i >= 0; i--) {
          const s = shooters[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt * 0.9;
          if (s.life <= 0) {
            shooters.splice(i, 1);
            continue;
          }
          const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.12, s.y - s.vy * 0.12);
          g.addColorStop(0, `rgba(255,255,255,${s.life})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12);
          ctx.stroke();
        }

        // rocket arriving from far away
        if (!rocket && now > nextRocketAt) {
          const rightToLeft = Math.random() < 0.5;
          rocket = {
            t: 0,
            dur: 9,
            sx: w * (rightToLeft ? 0.62 : 0.38),
            sy: h * 0.32, // far away, near the horizon
            ex: w * (rightToLeft ? -0.15 : 1.15),
            ey: h * 1.2,
          };
        }
        if (rocket) {
          rocket.t += dt / rocket.dur;
          const t = rocket.t;
          if (t >= 1) {
            rocket = null;
            nextRocketAt = now + 16000 + Math.random() * 12000;
          } else {
            const e = t * t * (1.6 - 0.6 * t); // accelerates toward us
            const x = rocket.sx + (rocket.ex - rocket.sx) * e;
            const yy = rocket.sy + (rocket.ey - rocket.sy) * e;
            const vx = rocket.ex - rocket.sx;
            const vy = rocket.ey - rocket.sy;
            const ang = Math.atan2(vy, vx) + Math.PI / 2; // nose points along travel
            const scale = 3 + e * 60; // tiny speck far away -> big up close
            // trail
            const tail = scale * 9;
            const tx = x - (vx / Math.hypot(vx, vy)) * tail;
            const ty = yy - (vy / Math.hypot(vx, vy)) * tail;
            const tg = ctx.createLinearGradient(x, yy, tx, ty);
            tg.addColorStop(0, 'rgba(167,139,250,0.45)');
            tg.addColorStop(1, 'rgba(167,139,250,0)');
            ctx.strokeStyle = tg;
            ctx.lineWidth = Math.max(1, scale * 0.5);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x, yy);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            ctx.save();
            ctx.translate(x, yy);
            ctx.rotate(ang);
            ctx.scale(scale, scale);
            ctx.globalAlpha = Math.min(1, t * 6) * Math.min(1, (1 - t) * 6);
            drawRocket(Math.random());
            ctx.restore();
          }
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" aria-hidden="true" />;
}
