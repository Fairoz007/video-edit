import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface IntroGraphicProps {
  title: string;
  subtitle?: string;
}

export const IntroGraphic: React.FC<IntroGraphicProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const lineWidth = interpolate(frame, [10, 40], [0, 320], { extrapolateRight: 'clamp' });
  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(145deg, #050508 0%, #12122a 45%, #1a1040 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(129,140,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '15%',
          top: '20%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '10%',
          bottom: '15%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.28) 0%, transparent 70%)',
          filter: 'blur(36px)',
        }}
      />
      <div style={{ textAlign: 'center', transform: `scale(${0.85 + titleSpring * 0.15})` }}>
        <p
          style={{
            color: '#a5b4fc',
            fontSize: 22,
            letterSpacing: 8,
            textTransform: 'uppercase',
            marginBottom: 20,
            fontFamily: 'Inter, system-ui, sans-serif',
            opacity: subtitleOpacity,
          }}
        >
          {subtitle || 'Documentary'}
        </p>
        <h1
          style={{
            fontSize: 88,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.05,
            fontFamily: 'Inter, system-ui, sans-serif',
            maxWidth: 1400,
            padding: '0 48px',
            background: 'linear-gradient(90deg, #e0e7ff, #c4b5fd, #f0abfc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </h1>
        <div
          style={{
            height: 4,
            width: lineWidth,
            margin: '32px auto 0',
            borderRadius: 2,
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
