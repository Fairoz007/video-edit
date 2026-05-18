import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { displayFamily, interFamily } from '../lib/fonts';

export interface LowerThirdProps {
  title: string;
  subtitle?: string;
}

export const LowerThird: React.FC<LowerThirdProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame, fps, config: { damping: 20 } });
  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        bottom: 120,
        opacity,
        transform: `translateX(${(1 - slide) * -80}px)`,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(99,102,241,0.95), rgba(168,85,247,0.85))',
          padding: '14px 28px',
          borderRadius: 8,
          borderLeft: '4px solid #f0abfc',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#fff',
            fontSize: 32,
            fontWeight: 700,
            fontFamily: displayFamily,
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              margin: '4px 0 0',
              color: '#e0e7ff',
              fontSize: 18,
              fontFamily: interFamily,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
