import { linearTiming, springTiming, type TransitionTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';

export type TransitionKind = 'fade' | 'crossfade' | 'slide' | 'zoom' | 'wipe' | 'flip';

const TRANSITION_DURATION = 20;

export function transitionTiming(
  kind: TransitionKind,
  durationInFrames: number = TRANSITION_DURATION,
): TransitionTiming {
  const frames = Math.max(4, durationInFrames);
  if (kind === 'zoom' || kind === 'slide') {
    return springTiming({ config: { damping: 200 }, durationInFrames: frames });
  }
  return linearTiming({ durationInFrames: frames });
}

export function mapTemplateTransitionType(type: string): TransitionKind {
  switch (type) {
    case 'wipe':
    case 'iris_wipe':
    case 'glitch_slide':
    case 'smash_cut':
      return 'wipe';
    case 'slide':
      return 'slide';
    case 'zoom':
    case 'zoom_through':
      return 'zoom';
    case 'fade':
    case 'fade_through_black':
    case 'fade_through_warm_white':
    case 'cross_dissolve_slow':
    case 'cross_dissolve_long':
      return 'fade';
    case 'crossfade':
    case 'cross_dissolve':
    default:
      return 'crossfade';
  }
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
