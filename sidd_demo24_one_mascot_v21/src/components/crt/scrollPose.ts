import { MathUtils } from 'three';

export function scrollPose(progress: number, aspect: number, focus: number) {
  const travel = MathUtils.smoothstep(progress, 0, 1);
  const cabinetDistance = Math.max(6.22, 9.65 / aspect);
  const entranceDistance = cabinetDistance + 2.35;
  const focusDistance = 1.43 + Math.max(3.68, 4.10 / aspect);
  const restDistance = MathUtils.lerp(entranceDistance, cabinetDistance, travel);
  return {
    travel,
    x: MathUtils.lerp(-2.6, 0, travel),
    cameraX: MathUtils.lerp(-.62, 0, focus),
    cameraY: MathUtils.lerp(2.42, 1.98, focus),
    cameraZ: MathUtils.lerp(restDistance, focusDistance, focus),
    aimX: MathUtils.lerp(-.65 * (1 - travel) - .48 * MathUtils.smoothstep(1.7 - aspect, 0, .65), 0, focus),
    aimY: MathUtils.lerp(1.64, 1.98, focus),
    aimZ: 1.43 * focus,
  };
}
