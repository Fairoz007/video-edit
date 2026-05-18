import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

/** Top-edge progress bar tied to global playhead. */
export const GlobalProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #7C3AED, #EC4899)',
          boxShadow: '0 0 12px rgba(124,58,237,0.6)',
        }}
      />
    </div>
  );
};
