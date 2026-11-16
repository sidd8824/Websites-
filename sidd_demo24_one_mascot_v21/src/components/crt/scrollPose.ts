export function scrollPose(progress: number, turns: number, aspect: number, reducedMotion = false) {
  const ease = (from: number, to: number) => {
    const t = Math.min(1, Math.max(0, (progress - from) / (to - from)));
    return t * t * (3 - 2 * t);
  };
  const entry = ease(0, .48);
  const rotation = ease(.025, .51);
  const push = ease(.51, .93);
  const figureDistance = 7.15 * Math.max(1, 1.04 / aspect);
  const screenDistance = Math.max(3.65, 4.15 / aspect);
  const mix = (a: number, b: number) => a + (b - a) * push;
  return {
    y: reducedMotion ? 0 : -2.85 * (1 - entry),
    yaw: reducedMotion ? 0 : .44 * (1 - rotation) + 2 * Math.PI * turns * rotation,
    camera: [mix(.16, 0), mix(2.6, 1.98), mix(figureDistance, 1.42 + screenDistance)],
    aimY: mix(1.66, 1.98),
    entry,
    push,
  };
}
