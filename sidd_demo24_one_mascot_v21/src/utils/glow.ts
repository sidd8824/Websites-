import type { CSSProperties } from 'react';

/** Turns "#8B5CF6" into the `--glow: "139 92 246"` custom property the .glass classes read. */
export function glowStyle(hex: string): CSSProperties {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { ['--glow']: `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}` } as unknown as CSSProperties;
}

/** "#8B5CF6" -> "139 92 246" (space separated, for rgb(var(--x) / alpha)). */
export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
