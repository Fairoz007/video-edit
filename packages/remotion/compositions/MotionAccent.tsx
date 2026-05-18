import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

/** Floating particles + corner brackets — light motion graphics overlay. */
export const MotionAccent: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const pulse = interpolate(frame % 90, [0, 45, 90], [0.35, 0.85, 0.35]);
  const sweepX = interpolate(frame, [0, durationInFrames], [-120, 120]);

  const particles = Array.from({ length: 12 }, (_, i) => {
    const y = 80 + ((i * 137) % 900);
    const x = 100 + ((i * 211) % 1700) + Math.sin((frame + i * 20) / 40) * 24;
    const size = 4 + (i % 3);
    const alpha = 0.15 + (i % 5) * 0.08;
    return { x, y, size, alpha };
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `rgba(168, 85, 247, ${p.alpha * pulse})`,
            boxShadow: `0 0 12px rgba(99, 102, 241, ${p.alpha})`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: `calc(50% + ${sweepX}px)`,
          transform: 'translateX(-50%)',
          width: 180,
          height: 3,
          borderRadius: 2,
          background: 'linear-gradient(90deg, transparent, #a855f7, #6366f1, transparent)',
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 28,
          left: 28,
          width: 48,
          height: 48,
          borderTop: '3px solid rgba(129,140,248,0.6)',
          borderLeft: '3px solid rgba(129,140,248,0.6)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          right: 28,
          width: 48,
          height: 48,
          borderBottom: '3px solid rgba(168,85,247,0.6)',
          borderRight: '3px solid rgba(168,85,247,0.6)',
        }}
      />
    </AbsoluteFill>
  );
};
