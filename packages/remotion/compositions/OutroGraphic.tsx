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
import { useVisualTemplate } from '../lib/visualTemplate';

export interface OutroGraphicProps {
  channelName?: string;
}

function CtaButton({
  icon,
  label,
  accent,
  delay,
  phaseOffset = 0,
  outline = false,
}: {
  icon: string;
  label: string;
  accent: string;
  delay: number;
  phaseOffset?: number;
  outline?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  const slideY = interpolate(enter, [0, 1], [20, 0], { extrapolateRight: 'clamp' });
  const pulse = 1 + Math.sin((frame + phaseOffset) / 30) * 0.04;

  return (
    <div
      style={{
        opacity: Math.max(0, enter),
        transform: `translateY(${slideY}px) scale(${Math.max(0, enter) * pulse})`,
      }}
    >
      <div
        style={{
          padding: '14px 28px',
          borderRadius: 12,
          background: outline ? 'transparent' : accent,
          border: outline ? `2px solid ${accent}` : undefined,
          fontSize: 22,
          fontWeight: 600,
          color: outline ? accent : '#fff',
          fontFamily: interFamily,
          boxShadow: outline ? 'none' : `0 8px 32px ${accent}66`,
        }}
      >
        {icon} {label}
      </div>
    </div>
  );
}

export const OutroGraphic: React.FC<OutroGraphicProps> = ({ channelName = 'DocuForge' }) => {
  const theme = useVisualTemplate();
  const outro = theme.outro;
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
    [1, outro.style === 'fade_to_black_title_card' ? 0.95 : 0.85],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const outlineCtas =
    outro.style === 'warm_editorial_close' || outro.style === 'fade_to_black_title_card';
  const showParticles = outro.style === 'neon_endcard' || outro.style === 'cinematic_cta';
  const thanksColor = outro.style === 'warm_editorial_close' ? theme.palette.muted : theme.palette.muted;

  return (
    <AbsoluteFill
      style={{
        background: outro.bg,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: endFade,
      }}
    >
      {showParticles &&
        Array.from({ length: 20 }, (_, i) => {
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
                background: `color-mix(in srgb, ${theme.palette.primary} ${15 + (i % 3) * 8}%, transparent)`,
                filter: 'blur(1px)',
              }}
            />
          );
        })}

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            color: thanksColor,
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
            color: theme.palette.text,
            fontSize: outro.style === 'warm_editorial_close' ? 56 : 64,
            fontWeight: 700,
            margin: '0 0 48px',
            fontFamily: displayFamily,
            letterSpacing: outro.style === 'warm_editorial_close' ? 4 : 10,
            fontStyle: outro.style === 'warm_editorial_close' ? 'italic' : 'normal',
            opacity: Math.max(0, brandEnter),
            transform: `scale(${brandScale})`,
          }}
        >
          {channelName}
        </h2>
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
          <CtaButton
            icon="🔔"
            label="Subscribe"
            accent={outro.ctaSubscribe}
            delay={35}
            outline={outlineCtas}
          />
          <CtaButton
            icon="👍"
            label="Like"
            accent={outro.ctaLike}
            delay={42}
            phaseOffset={30}
            outline={outlineCtas}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
