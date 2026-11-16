export function scrollPose(progress: number, turns: number, aspect: number, reducedMotion = false) {
  const ease = (from: number, to: number) => {
    const t = Math.min(1, Math.max(0, (progress - from) / (to - from)));
    return t * t * (3 - 2 * t);
  };
  const entry = ease(0, .48);
  const rotation = ease(.025, .51);
  const push = ease(.51, .93);
  const figureDistance = 9.25 * Math.max(1, .95 / aspect);
  const screenDistance = Math.max(5.7, 6.15 / aspect);
  const mix = (a: number, b: number) => a + (b - a) * push;
  return {
    y: reducedMotion ? 0 : -1.35 * (1 - entry),
    yaw: reducedMotion ? 0 : .44 * (1 - rotation) + 2 * Math.PI * turns * rotation - .19 * push,
    camera: [mix(.40, .22), mix(2.9, 2.13), mix(figureDistance, 1.42 + screenDistance)],
    aimY: mix(1.63, 1.72),
    entry,
    push,
  };
}
