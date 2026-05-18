import { linearTiming, springTiming, type TransitionTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';

export type TransitionKind = 'fade' | 'crossfade' | 'slide' | 'zoom' | 'wipe' | 'flip';

const TRANSITION_DURATION = 18;

export function transitionTiming(kind: TransitionKind): TransitionTiming {
  if (kind === 'zoom' || kind === 'slide') {
    return springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_DURATION });
  }
  return linearTiming({ durationInFrames: TRANSITION_DURATION });
}

export function transitionPresentation(kind: TransitionKind) {
  switch (kind) {
    case 'slide':
      return slide({ direction: 'from-right' });
    case 'wipe':
      return wipe();
    case 'flip':
      return flip();
    case 'zoom':
      return fade();
    case 'crossfade':
    case 'fade':
    default:
      return fade();
  }
}

export function getTransitionDurationFrames(fps: number, kind: TransitionKind): number {
  return transitionTiming(kind).getDurationInFrames({ fps });
}
