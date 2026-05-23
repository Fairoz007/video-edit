import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export interface TitleCardProps {
  [key: string]: unknown;
  title: string;
  subtitle?: string;
}

export const TitleCard: React.FC<TitleCardProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, 70, 90], [0, 1, 1, 0]);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #0a0a0f, #1e1b4b, #312e81)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      <h1 style={{ color: '#fff', fontSize: 80, fontWeight: 700, margin: 0 }}>{title}</h1>
      {subtitle && (
        <p style={{ color: '#a5b4fc', fontSize: 28, marginTop: 16 }}>{subtitle}</p>
      )}
    </AbsoluteFill>
  );
};
