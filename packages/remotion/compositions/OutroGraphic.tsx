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

export interface OutroGraphicProps {
  channelName?: string;
}

function CtaButton({
  icon,
  label,
  accent,
  delay,
  phaseOffset = 0,
}: {
  icon: string;
  label: string;
  accent: string;
  delay: number;
  phaseOffset?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  const slideY = interpolate(enter, [0, 1], [20, 0], { extrapolateRight: 'clamp' });
  const pulse = 1 + Math.sin((frame + phaseOffset) / 30) * 0.04;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        opacity: Math.max(0, enter),
        transform: `translateY(${slideY}px) scale(${Math.max(0, enter) * pulse})`,
      }}
    >
      <div
        style={{
          padding: '14px 28px',
          borderRadius: 12,
          background: accent,
          fontSize: 22,
          fontWeight: 600,
          color: '#fff',
          fontFamily: interFamily,
          boxShadow: `0 8px 32px ${accent}66`,
        }}
      >
        {icon} {label}
      </div>
    </div>
  );
}

export const OutroGraphic: React.FC<OutroGraphicProps> = ({ channelName = 'DocuForge' }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const thanksOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const brandEnter = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 90 } });
  const brandScale = interpolate(brandEnter, [0, 1], [0.85, 1]);

  const endFade = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0.85],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at center, #0F0A1E 0%, #12101f 55%, #000000 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: endFade,
      }}
    >
      {Array.from({ length: 20 }, (_, i) => {
        const x = 10 + ((i * 97) % 80);
        const y = 15 + ((i * 53) % 70);
        const drift = Math.sin((frame + i * 12) / 45) * 8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y + drift * 0.1}%`,
              width: 8 + (i % 4) * 2,
              height: 8 + (i % 4) * 2,
              borderRadius: '50%',
              background: `rgba(124,58,237,${0.15 + (i % 3) * 0.08})`,
              filter: 'blur(1px)',
            }}
          />
        );
      })}

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            color: '#94A3B8',
            fontSize: 20,
            letterSpacing: 3,
            marginBottom: 16,
            fontFamily: interFamily,
            fontWeight: 300,
            opacity: thanksOpacity,
          }}
        >
          Thanks for watching
        </p>
        <h2
          style={{
            color: '#fff',
            fontSize: 64,
            fontWeight: 700,
            margin: '0 0 48px',
            fontFamily: displayFamily,
            letterSpacing: 10,
            opacity: Math.max(0, brandEnter),
            transform: `scale(${brandScale})`,
          }}
        >
          {channelName}
        </h2>
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
          <CtaButton icon="🔔" label="Subscribe" accent="#7C3AED" delay={35} />
          <CtaButton icon="👍" label="Like" accent="#EC4899" delay={42} phaseOffset={30} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
