import { Easing, interpolate, type EasingFunction } from 'remotion';

export function slideFadeOpacity(
  frame: number,
  enterFrames: number,
  exitStartFrame: number,
  exitFrames: number,
  totalFrames: number,
): number {
  const fadeIn = interpolate(frame, [0, enterFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + exitFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    },
  );
  if (frame >= exitStartFrame) return fadeOut;
  return fadeIn;
}

export function slideFadeX(
  frame: number,
  enterFrames: number,
  fromX: number,
  exitStartFrame: number,
  exitFrames: number,
  toX: number,
): number {
  const enter = interpolate(frame, [0, enterFrames], [fromX, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const exit = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + exitFrames],
    [0, toX],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    },
  );
  if (frame >= exitStartFrame) return exit;
  return enter;
}

export function slideFadeY(
  frame: number,
  enterFrames: number,
  fromY: number,
  exitStartFrame: number,
  exitFrames: number,
  toY: number,
  easing: EasingFunction = Easing.out(Easing.cubic),
): number {
  const enter = interpolate(frame, [0, enterFrames], [fromY, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
  const exit = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + exitFrames],
    [0, toY],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    },
  );
  if (frame >= exitStartFrame) return exit;
  return enter;
}

export function drawInProgress(frame: number, startFrame: number, durationFrames: number): number {
  return interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
}

export function pulseOpacity(
  frame: number,
  min: number,
  max: number,
  periodFrames: number,
): number {
  const t = (frame % periodFrames) / periodFrames;
  const wave = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
  return min + (max - min) * wave;
}
