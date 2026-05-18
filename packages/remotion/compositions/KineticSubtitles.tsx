import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { interFamily } from '../lib/fonts';

export interface WordCue {
  word: string;
  startSec: number;
  endSec: number;
}

export interface KineticSubtitlesProps {
  wordCues: WordCue[];
  highlightColor?: string;
}

export const KineticSubtitles: React.FC<KineticSubtitlesProps> = ({
  wordCues,
  highlightColor = '#F59E0B',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  const active = wordCues.find((c) => timeSec >= c.startSec && timeSec < c.endSec);
  if (!active) return null;

  const localFrame = Math.round((timeSec - active.startSec) * fps);
  const durationFrames = Math.max(1, Math.round((active.endSec - active.startSec) * fps));

  const enterY = interpolate(localFrame, [0, 4], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const exitY = interpolate(
    localFrame,
    [durationFrames - 3, durationFrames],
    [0, -12],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const enterOpacity = interpolate(localFrame, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitOpacity = interpolate(
    localFrame,
    [durationFrames - 3, durationFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const y = localFrame >= durationFrames - 3 ? exitY : enterY;
  const opacity = localFrame >= durationFrames - 3 ? exitOpacity : enterOpacity;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 80,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.55)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.9)',
        }}
      >
        <span
          style={{
            color: highlightColor,
            fontSize: 52,
            fontWeight: 700,
            fontFamily: interFamily,
            textTransform: 'none',
            letterSpacing: 0.5,
          }}
        >
          {active.word}
        </span>
      </div>
    </div>
  );
};
