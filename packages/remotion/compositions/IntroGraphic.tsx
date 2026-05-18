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

export interface IntroGraphicProps {
  title: string;
  subtitle?: string;
  channelName?: string;
}

function CinematicRevealIntro({
  title,
  subtitle,
  channelName,
}: IntroGraphicProps) {
  const theme = useVisualTemplate();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const blackFlash = interpolate(frame, [0, 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoScale = spring({ frame, fps, config: { damping: 18, stiffness: 120 }, durationInFrames: 20 });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleEnter = spring({ frame: frame - 40, fps, config: { damping: 16, stiffness: 90 }, durationInFrames: 25 });
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
  const tagOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: '#000', opacity: blackFlash, pointerEvents: 'none', zIndex: 20 }} />
      <p
        style={{
          position: 'absolute',
          top: '42%',
          left: 0,
          right: 0,
          textAlign: 'center',
          margin: 0,
          color: theme.intro.accentColor,
          fontSize: 28,
          letterSpacing: 8,
          fontFamily: displayFamily,
          opacity: logoOpacity * (1 - titleOpacity * 0.5),
          transform: `scale(${0.8 + logoScale * 0.2})`,
        }}
      >
        {channelName}
      </p>
      <div style={{ textAlign: 'center', opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            margin: 0,
            fontFamily: displayFamily,
            letterSpacing: 12,
            color: theme.intro.titleColor,
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
            background: theme.intro.accentColor,
          }}
        />
        <p
          style={{
            color: theme.palette.accent,
            fontSize: 22,
            letterSpacing: 6,
            fontFamily: interFamily,
            margin: 0,
            opacity: tagOpacity,
          }}
        >
          {subtitle || 'A DocuForge Documentary'}
        </p>
      </div>
    </>
  );
}

function TypewriterIntro({ title, subtitle, channelName }: IntroGraphicProps) {
  const theme = useVisualTemplate();
  const frame = useCurrentFrame();
  const chars = Math.min(title.length, Math.floor(frame / 2));
  const subOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ textAlign: 'center', padding: '0 80px' }}>
      <p style={{ color: theme.palette.muted, fontSize: 14, letterSpacing: 6, marginBottom: 24 }}>{channelName}</p>
      <h1
        style={{
          fontFamily: displayFamily,
          fontSize: 72,
          fontStyle: 'italic',
          color: theme.intro.titleColor,
          margin: 0,
          minHeight: 90,
        }}
      >
        {title.slice(0, chars)}
        <span style={{ opacity: frame % 16 < 8 ? 1 : 0 }}>|</span>
      </h1>
      <p style={{ color: theme.palette.muted, fontSize: 20, marginTop: 32, opacity: subOpacity, fontFamily: interFamily }}>
        {subtitle}
      </p>
    </div>
  );
}

function GlitchSlamIntro({ title, subtitle }: IntroGraphicProps) {
  const theme = useVisualTemplate();
  const frame = useCurrentFrame();
  const slam = spring({ frame, fps: 30, config: { damping: 8, stiffness: 200 }, durationInFrames: 8 });
  const glitchX = frame < 12 ? Math.sin(frame * 3) * 6 : 0;
  const scanOpacity = interpolate(frame % 4, [0, 2, 4], [0.15, 0.05, 0.15]);

  return (
  <>
      {frame < 12 && (
        <AbsoluteFill
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,245,255,${scanOpacity}) 2px, rgba(0,245,255,${scanOpacity}) 4px)`,
            pointerEvents: 'none',
          }}
        />
      )}
      <h1
        style={{
          fontFamily: displayFamily,
          fontSize: 88,
          fontWeight: 900,
          textTransform: 'uppercase',
          color: theme.intro.titleColor,
          textShadow: theme.subtitles.textShadow || `0 0 24px ${theme.palette.primary}`,
          transform: `scale(${0.5 + slam * 0.5}) translateX(${glitchX}px)`,
          margin: 0,
          textAlign: 'center',
        }}
      >
        {title}
      </h1>
      <p style={{ textAlign: 'center', color: theme.palette.primary, fontSize: 18, letterSpacing: 4, marginTop: 16 }}>
        {subtitle}
      </p>
    </>
  );
}

function EditorialBuildIntro({ title, subtitle }: IntroGraphicProps) {
  const theme = useVisualTemplate();
  const frame = useCurrentFrame();
  const locOpacity = interpolate(frame, [10, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const lineW = interpolate(frame, [25, 45], [0, 200], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const titleOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ padding: '0 100px', width: '100%' }}>
      <p
        style={{
          fontFamily: interFamily,
          fontSize: 14,
          letterSpacing: 3,
          color: theme.intro.accentColor,
          opacity: locOpacity,
          marginBottom: 20,
        }}
      >
        DOCUMENTARY
      </p>
      <div style={{ height: 1, width: lineW, background: theme.intro.accentColor, marginBottom: 32 }} />
      <h1
        style={{
          fontFamily: displayFamily,
          fontSize: 64,
          fontStyle: 'italic',
          color: theme.intro.titleColor,
          opacity: titleOpacity,
          margin: '0 0 16px',
          maxWidth: 900,
        }}
      >
        {title}
      </h1>
      <p style={{ fontFamily: interFamily, fontSize: 22, color: theme.palette.muted, opacity: subOpacity }}>{subtitle}</p>
    </div>
  );
}

export const IntroGraphic: React.FC<IntroGraphicProps> = (props) => {
  const theme = useVisualTemplate();
  const style = theme.intro.style;

  let inner: React.ReactNode;
  if (style === 'typewriter_title') inner = <TypewriterIntro {...props} />;
  else if (style === 'glitch_slam') inner = <GlitchSlamIntro {...props} />;
  else if (style === 'editorial_build') inner = <EditorialBuildIntro {...props} />;
  else inner = <CinematicRevealIntro {...props} />;

  return (
    <AbsoluteFill
      style={{
        background: theme.intro.bg,
        justifyContent: 'center',
        alignItems: style === 'editorial_build' ? 'flex-start' : 'center',
        paddingTop: style === 'editorial_build' ? 180 : 0,
        overflow: 'hidden',
      }}
    >
      {inner}
    </AbsoluteFill>
  );
};
