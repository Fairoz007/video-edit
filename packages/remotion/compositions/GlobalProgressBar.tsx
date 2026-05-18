import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { useVisualTemplate } from '../lib/visualTemplate';

export const GlobalProgressBar: React.FC = () => {
  const theme = useVisualTemplate();
  const bar = theme.progressBar;
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isBottom = bar.position === 'bottom';

  return (
    <div
      style={{
        position: 'absolute',
        top: isBottom ? 'auto' : 0,
        bottom: isBottom ? 0 : 'auto',
        left: 0,
        right: 0,
        height: bar.height,
        background: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none',
        zIndex: 50,
        opacity: bar.opacity,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: bar.color,
          boxShadow: bar.color.includes('gradient')
            ? '0 0 12px rgba(124,58,237,0.4)'
            : `0 0 8px ${theme.palette.primary}99`,
        }}
      />
    </div>
  );
};
