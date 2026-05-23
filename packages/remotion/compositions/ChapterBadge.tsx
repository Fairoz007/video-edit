import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { slideFadeOpacity, slideFadeX } from '../lib/animations';
import { interFamily } from '../lib/fonts';
import { useVisualTemplate } from '../lib/visualTemplate';

export interface ChapterBadgeSpec {
  label: string;
  fromFrame: number;
  durationFrames: number;
}

const BadgeContent: React.FC<{
  label: string;
  durationFrames: number;
}> = ({ label, durationFrames }) => {
  const theme = useVisualTemplate();
  const badge = theme.chapterBadge;
  const frame = useCurrentFrame();
  const enterFrames = 15;
  const exitFrames = 12;
  const safeDuration = Math.max(enterFrames + exitFrames + 1, durationFrames);
  const exitDelayFrames = Number(badge.exitDelayFrames) || 60;
  const exitDelay = Math.max(
    enterFrames + 20,
    safeDuration - exitDelayFrames,
  );

  const opacity = slideFadeOpacity(frame, enterFrames, exitDelay, exitFrames, safeDuration);
  const x =
    badge.style === 'serif_tag' || badge.style === 'editorial_category'
      ? 0
      : slideFadeX(frame, enterFrames, -40, exitDelay, exitFrames, -30);

  const boxStyle: React.CSSProperties = {
    padding: badge.style === 'editorial_category' ? '4px 0' : '8px 18px',
    borderRadius: badge.style === 'neon_pill' ? 20 : 6,
    background: badge.background || 'rgba(124,58,237,0.85)',
    border: badge.border,
    borderBottom: badge.borderBottom,
    borderLeft: badge.borderLeft,
    boxShadow: badge.boxShadow,
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        bottom: badge.style === 'editorial_category' ? '18%' : '15%',
        opacity,
        transform: `translateX(${x}px)`,
        pointerEvents: 'none',
      }}
    >
      <div style={boxStyle}>
        <span
          style={{
            color: badge.color,
            fontSize: badge.style === 'neon_pill' ? 14 : 18,
            fontWeight: badge.style === 'neon_pill' ? 700 : 600,
            fontFamily: interFamily,
            fontStyle: badge.fontStyle as React.CSSProperties['fontStyle'],
            letterSpacing: badge.letterSpacing,
            textTransform: badge.textTransform as React.CSSProperties['textTransform'],
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export const ChapterBadgeLayer: React.FC<{ badges: ChapterBadgeSpec[] }> = ({ badges }) => {
  return (
    <>
      {badges.map((badge, i) => (
        <Sequence
          key={`${badge.label}-${badge.fromFrame}-${i}`}
          from={badge.fromFrame}
          durationInFrames={badge.durationFrames}
        >
          <AbsoluteFill>
            <BadgeContent label={badge.label} durationFrames={badge.durationFrames} />
          </AbsoluteFill>
        </Sequence>
      ))}
    </>
  );
};
