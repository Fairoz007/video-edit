import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { displayFamily } from '../../lib/fonts';

export interface HotspotProps {
  x: number;
  y: number;
  label: string;
}

export const Hotspot: React.FC<HotspotProps> = ({ x, y, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const ringOpacity = interpolate(frame % 45, [0, 45], [0.85, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        zIndex: 15,
        pointerEvents: 'none',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: 56,
          height: 56,
          marginLeft: -28,
          borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.9)',
          opacity: ringOpacity,
          transform: 'scale(1.4)',
        }}
      />
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#6366f1',
          boxShadow: '0 0 20px rgba(99,102,241,0.8)',
          margin: '0 auto',
        }}
      />
      <span
        style={{
          display: 'block',
          marginTop: 8,
          padding: '6px 12px',
          borderRadius: 6,
          background: 'rgba(15,15,25,0.92)',
          color: '#e0e7ff',
          fontSize: 16,
          fontWeight: 600,
          fontFamily: displayFamily,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
};
