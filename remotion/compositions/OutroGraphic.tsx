import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface OutroGraphicProps {
  channelName?: string;
}

function CtaButton({
  icon,
  label,
  accent,
  delay,
}: {
  icon: string;
  label: string;
  accent: string;
  delay: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: frame - delay, fps, config: { damping: 12 } });

  return <CtaBlock icon={icon} label={label} accent={accent} scale={Math.max(0, scale)} />;
}

function CtaBlock({
  icon,
  label,
  accent,
  scale,
}: {
  icon: string;
  label: string;
  accent: string;
  scale: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 24,
          background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          boxShadow: `0 12px 40px ${accent}55`,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          color: '#e2e8f0',
          fontSize: 26,
          fontWeight: 600,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export const OutroGraphic: React.FC<OutroGraphicProps> = ({ channelName = 'DocuForge' }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14 } });
  const pulse = 1 + Math.sin(frame / 8) * 0.04;

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #0a0a12 0%, #1e1b4b 50%, #312e81 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          transform: `scale(${enter * pulse})`,
          opacity: enter,
        }}
      >
        <p
          style={{
            color: '#c4b5fd',
            fontSize: 28,
            marginBottom: 12,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Thanks for watching
        </p>
        <h2
          style={{
            color: '#fff',
            fontSize: 56,
            fontWeight: 700,
            margin: '0 0 48px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {channelName}
        </h2>
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', alignItems: 'center' }}>
          <CtaButton icon="🔔" label="Subscribe" accent="#ef4444" delay={8} />
          <CtaButton icon="👍" label="Like" accent="#3b82f6" delay={14} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
