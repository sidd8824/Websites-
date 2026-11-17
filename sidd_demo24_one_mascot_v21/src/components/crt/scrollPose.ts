import { MathUtils } from 'three';

export function scrollPose(progress: number, aspect: number, focus: number, grabX = 0, grabY = 0) {
  const travel = MathUtils.smoothstep(progress, 0, 1);
  const cabinetDistance = Math.max(7.25, 9.65 / aspect);
  const entranceDistance = cabinetDistance + 2.35;
  const focusDistance = Math.max(6.65, 7.02 / aspect);
  // Leave space for the cabinet corners as it tilts during a grab.
  const grabClearance = Math.hypot(grabX * Math.max(.85, 1.8 / aspect), grabY * .72);
  const restDistance = MathUtils.lerp(entranceDistance, cabinetDistance, travel);
  return {
    travel,
    x: MathUtils.lerp(-2.6, 0, travel),
    cameraX: MathUtils.lerp(-.62, 0, focus),
    cameraY: MathUtils.lerp(2.42, 1.92, focus),
    cameraZ: MathUtils.lerp(restDistance, focusDistance, focus) + grabClearance,
    aimX: MathUtils.lerp(-.65 * (1 - travel) - .48 * MathUtils.smoothstep(1.7 - aspect, 0, .65), 0, focus),
    aimY: MathUtils.lerp(1.64, 1.63, focus),
    aimZ: 1.43 * focus,
  };
}
