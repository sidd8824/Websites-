import { useEffect, useRef } from 'react';

// Dark "paper relief" topographic map behind the whole site (inspired by the paper-relief
// reference). A fragment shader builds a slowly morphing height field, shades it like soft
// relief and draws thin contour lines on it.
//  - It drifts and breathes on its own (very slowly).
//  - It slides as you scroll.
//  - The terrain swells under the mouse, so new contour rings bloom around the cursor.
// Everything is additive on black, so it works as a light layer over the dark theme.

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = r * p * 2.0 + 7.1;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes.y;
  float t = uTime;
  vec2 p = uv * 1.05;
  p.y -= uScroll * 0.00045; // terrain slides with the page

  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.5)), fbm(p + vec2(5.2, 1.3) - t * 0.4));
  float h = fbm(p + 1.9 * q + vec2(t * 0.25, 0.0));
  h = smoothstep(0.12, 0.88, h);

  // the mouse pushes the terrain up
  vec2 m = uMouse / uRes.y;
  float d = length(uv - m);
  float bump = exp(-d * d * 7.0);
  h += 0.28 * bump;

  // soft shaded relief
  vec3 deep = vec3(0.0);
  vec3 hi = vec3(0.13, 0.08, 0.30);
  vec3 mid = vec3(0.30, 0.08, 0.30);
  vec3 col = mix(deep, hi, smoothstep(0.2, 0.85, h));
  col = mix(col, mid, smoothstep(0.35, 0.9, q.x) * 0.45);
  float relief = clamp((dFdx(h) - dFdy(h)) * uRes.y * 0.14, -1.0, 1.0);
  col += relief * 0.05 * vec3(0.7, 0.6, 1.0);

  // contour lines
  float v = h * 13.0;
  float fw = fwidth(v);
  float x = abs(fract(v) - 0.5);
  float line = 1.0 - smoothstep(0.0, fw * 1.4, 0.5 - x);
  float idx = floor(v + 0.5);
  float strong = step(mod(idx, 5.0), 0.5);
  vec3 lineCol = mix(vec3(0.72, 0.66, 1.0), vec3(0.35, 0.9, 1.0), clamp(bump * 1.4, 0.0, 1.0));
  col += lineCol * line * (0.055 + 0.075 * strong + 0.2 * bump);

  // faint glow under the cursor
  col += vec3(0.30, 0.18, 0.60) * bump * 0.22;

  outColor = vec4(col, 1.0);
}`;

export default function TopoBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return; // no WebGL2: the dark fluid background underneath still shows

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('Topo shader error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uScroll = gl.getUniformLocation(prog, 'uScroll');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      // keep the pixel count sane on huge screens
      const maxPx = 2_400_000;
      const px = window.innerWidth * window.innerHeight * dpr * dpr;
      if (px > maxPx) dpr *= Math.sqrt(maxPx / px);
      canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // mouse (smoothed) in CSS px, y up
    let tx = -5000;
    let ty = -5000;
    let sx = -5000;
    let sy = -5000;
    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = window.innerHeight - e.clientY;
      if (sx < -4000) { sx = tx; sy = ty; }
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      sx += (tx - sx) * 0.12;
      sy += (ty - sy) * 0.12;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 3.0 : (now - t0) / 1000 * 0.35);
      gl.uniform2f(uMouse, sx * dpr, sy * dpr);
      gl.uniform1f(uScroll, window.scrollY * dpr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  );
}
