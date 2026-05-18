import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { displayFamily, interFamily } from '../lib/fonts';

export interface IntroGraphicProps {
  title: string;
  subtitle?: string;
  channelName?: string;
}

export const IntroGraphic: React.FC<IntroGraphicProps> = ({
  title,
  subtitle,
  channelName = 'DocuForge',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const blackFlash = interpolate(frame, [0, 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
    durationInFrames: 20,
  });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const titleEnter = spring({
    frame: frame - 40,
    fps,
    config: { damping: 16, stiffness: 90 },
    durationInFrames: 25,
  });
  const titleY = interpolate(titleEnter, [0, 1], [40, 0]);
  const titleOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.exp),
  });

  const lineWidth = interpolate(frame, [48, 68], [0, 300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const tagOpacity = interpolate(frame, [55, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(145deg, #050508 0%, #12122a 45%, #1a1040 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          backgroundColor: '#000',
          opacity: blackFlash,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />

      <p
        style={{
          position: 'absolute',
          top: '42%',
          margin: 0,
          color: '#7C3AED',
          fontSize: 28,
          letterSpacing: 8,
          fontFamily: displayFamily,
          opacity: logoOpacity * (1 - titleOpacity * 0.5),
          transform: `scale(${0.8 + logoScale * 0.2})`,
        }}
      >
        {channelName}
      </p>

      <div
        style={{
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.05,
            fontFamily: displayFamily,
            letterSpacing: 12,
            color: '#fff',
            maxWidth: 1400,
            padding: '0 48px',
          }}
        >
          {title.toUpperCase()}
        </h1>
        <div
          style={{
            height: 2,
            width: lineWidth,
            margin: '24px auto',
            borderRadius: 2,
            background: '#7C3AED',
          }}
        />
        <p
          style={{
            color: '#F59E0B',
            fontSize: 22,
            letterSpacing: 6,
            fontWeight: 300,
            fontFamily: interFamily,
            margin: 0,
            opacity: tagOpacity,
          }}
        >
          {subtitle || 'THE GREATEST OF ALL TIME'}
        </p>
      </div>
    </AbsoluteFill>
  );
};
