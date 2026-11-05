// Tiny shared store: the Projects reel tells the single page-level mascot what colour to wear,
// when to get nudged, and whether the pinned reel is showing (the reel is the only view).
export interface MascotState { color: string; kick: number; reel: boolean }

let state: MascotState = { color: '#7F77DD', kick: 0, reel: true };
const listeners = new Set<() => void>();

export const getMascot = () => state;
export const subscribeMascot = (fn: () => void) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
export function setMascot(next: Partial<MascotState>) {
  const merged = { ...state, ...next };
  if (merged.color === state.color && merged.kick === state.kick && merged.reel === state.reel) return;
  state = merged;
  listeners.forEach((fn) => fn());
}
