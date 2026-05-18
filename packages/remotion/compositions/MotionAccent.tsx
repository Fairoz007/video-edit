import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

/** Subtle floating particles (corner brackets live in CornerBrackets). */
export const MotionAccent: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame % 90, [0, 45, 90], [0.35, 0.85, 0.35]);

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
            background: `rgba(124, 58, 237, ${p.alpha * pulse})`,
            boxShadow: `0 0 12px rgba(124, 58, 237, ${p.alpha})`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
