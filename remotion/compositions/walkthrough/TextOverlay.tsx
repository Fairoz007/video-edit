import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { displayFamily, interFamily } from '../../lib/fonts';

export interface TextOverlayProps {
  title: string;
  description?: string;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({ title, description }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({
    frame: frame - 12,
    fps,
    config: { damping: 10 },
  });

  const slideY = interpolate(titleOpacity, [0, 1], [24, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '8%',
        left: '50%',
        transform: `translateX(-50%) translateY(${slideY}px)`,
        textAlign: 'center',
        width: '82%',
        opacity: titleOpacity,
        pointerEvents: 'none',
        zIndex: 12,
      }}
    >
      <h2
        style={{
          margin: '0 0 10px',
          fontSize: 48,
          fontWeight: 800,
          color: '#fff',
          fontFamily: displayFamily,
          textShadow: '0 4px 24px rgba(0,0,0,0.65)',
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: 24,
            color: '#cbd5e1',
            fontFamily: interFamily,
            lineHeight: 1.4,
            textShadow: '0 2px 12px rgba(0,0,0,0.55)',
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
};
