import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { slideFadeOpacity, slideFadeX } from '../lib/animations';
import { interFamily } from '../lib/fonts';

export interface ChapterBadgeSpec {
  label: string;
  fromFrame: number;
  durationFrames: number;
}

const BadgeContent: React.FC<{
  label: string;
  durationFrames: number;
}> = ({ label, durationFrames }) => {
  const frame = useCurrentFrame();
  const enterFrames = 15;
  const exitDelay = Math.max(enterFrames + 20, durationFrames - 72);
  const exitFrames = 12;

  const opacity = slideFadeOpacity(frame, enterFrames, exitDelay, exitFrames, durationFrames);
  const x = slideFadeX(frame, enterFrames, -40, exitDelay, exitFrames, -30);

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        bottom: '15%',
        opacity,
        transform: `translateX(${x}px)`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(124,58,237,0.85)',
          borderRadius: 6,
          padding: '8px 18px',
          borderLeft: '3px solid #F59E0B',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            fontFamily: interFamily,
            letterSpacing: 0.5,
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
