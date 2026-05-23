import { linearTiming, springTiming, type TransitionTiming } from '@remotion/transitions';
import { clockWipe } from '@remotion/transitions/clock-wipe';
import { fade } from '@remotion/transitions/fade';
import { flip } from '@remotion/transitions/flip';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';

/** Remotion-native names from documentaryTemplates v2 VALID_TRANSITIONS */
export type TransitionKind =
  | 'fade'
  | 'crossfade'
  | 'slide'
  | 'zoom'
  | 'wipe'
  | 'flip'
  | 'clock'
  | 'dissolve'
  | 'ripple'
  | 'none';

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
    case 'flip':
      return 'flip';
    case 'clock':
      return 'clock';
    case 'dissolve':
    case 'ripple':
      return 'dissolve';
    case 'none':
      return 'none';
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

export function transitionPresentation(
  kind: TransitionKind,
  options?: {
    slideDirection?: string;
    wipeAngleDeg?: number;
    flipDirection?: string;
    width?: number;
    height?: number;
  },
) {
  const slideDir = (options?.slideDirection || 'from-right') as 'from-left' | 'from-right';
  const flipDir = (options?.flipDirection || 'from-right') as 'from-left' | 'from-right';

  switch (kind) {
    case 'slide':
      return slide({ direction: slideDir });
    case 'wipe':
      return wipe({ direction: slideDir });
    case 'flip':
      return flip({ direction: flipDir });
    case 'clock':
      return clockWipe({
        width: options?.width ?? 1920,
        height: options?.height ?? 1080,
      });
    case 'dissolve':
    case 'ripple':
    case 'zoom':
    case 'crossfade':
    case 'fade':
      return fade();
    case 'none':
      return fade();
    default:
      return fade();
  }
}

export function getTransitionDurationFrames(fps: number, kind: TransitionKind): number {
  return transitionTiming(kind).getDurationInFrames({ fps });
}
