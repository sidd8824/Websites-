export function clampTape(value: number, count: number) {
  return Math.max(0, Math.min(count - 1, value));
}

export function settleTape(value: number, origin: number, count: number) {
  const moved = value - origin;
  const nearest = Math.round(value);
  // A short, deliberate flick should still turn one tape.
  const target = nearest === Math.round(origin) && Math.abs(moved) >= .16
    ? nearest + Math.sign(moved)
    : nearest;
  return clampTape(target, count);
}

export function tapePose(offset: number, hover = 0) {
  const distance = Math.abs(offset);
  const emphasis = Math.max(0, 1 - distance * 1.18);
  return {
    x: 512 + Math.sin(offset * .48) * 610,
    y: 340 + (1 - Math.cos(offset * .48)) * 230 - hover * 12,
    rotation: offset * .22 * (1 - hover * .12),
    widthScale: Math.cos(Math.min(1.1, distance * .24)),
    scale: 1.10 - Math.min(.25, distance * .09) + hover * .025,
    alpha: Math.min(1, .58 + .42 * emphasis + .10 * hover),
  };
}

export function tapeAt(x: number, y: number, position: number, count: number) {
  let nearest: number | null = null;
  let distance = Infinity;
  for (let index = 0; index < count; index++) {
    const offset = index - position;
    if (Math.abs(offset) > 2 || Math.abs(offset) >= distance) continue;
    const pose = tapePose(offset);
    const dx = x - pose.x;
    const dy = y - pose.y;
    const cos = Math.cos(pose.rotation);
    const sin = Math.sin(pose.rotation);
    const localX = (dx * cos + dy * sin) / (pose.scale * pose.widthScale);
    const localY = (-dx * sin + dy * cos) / pose.scale;
    if (Math.abs(localX) <= 118 && localY >= -195 && localY <= 190) {
      nearest = index;
      distance = Math.abs(offset);
    }
  }
  return nearest;
}
