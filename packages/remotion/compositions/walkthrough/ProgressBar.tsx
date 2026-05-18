import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { displayFamily } from '../../lib/fonts';

export interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 12], [0, current / total], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 32,
        left: 48,
        right: 48,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: 4,
          borderRadius: 4,
          background: 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            borderRadius: 4,
            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
          }}
        />
      </div>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 14,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: displayFamily,
          letterSpacing: 1,
        }}
      >
        {current} / {total}
      </p>
    </div>
  );
};
