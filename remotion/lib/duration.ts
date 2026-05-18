import type { TransitionKind } from './transitions';
import { getTransitionDurationFrames } from './transitions';

export function sumSceneDurationsWithTransitions(
  sceneDurationsFrames: number[],
  fps: number,
  transitions: TransitionKind[],
): number {
  if (sceneDurationsFrames.length === 0) return 0;
  let total = sceneDurationsFrames.reduce((a, b) => a + b, 0);
  for (let i = 0; i < sceneDurationsFrames.length - 1; i++) {
    const kind = transitions[i % transitions.length] ?? 'fade';
    total -= getTransitionDurationFrames(fps, kind);
  }
  return Math.max(fps, total);
}
