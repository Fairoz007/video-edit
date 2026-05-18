import React from 'react';
import { useCurrentFrame } from 'remotion';
import { slideFadeOpacity, slideFadeX } from '../lib/animations';
import { displayFamily, interFamily } from '../lib/fonts';
import { useVisualTemplate } from '../lib/visualTemplate';

export interface LowerThirdProps {
  title: string;
  subtitle?: string;
  durationFrames?: number;
}

export const LowerThird: React.FC<LowerThirdProps> = ({
  title,
  subtitle,
  durationFrames = 100,
}) => {
  const theme = useVisualTemplate();
  const frame = useCurrentFrame();
  const enterFrames = 18;
  const accent = theme.lowerThird.accentColor;
  const exitStart = Math.max(enterFrames + 24, durationFrames - 12);
  const exitFrames = 12;

  const opacity = slideFadeOpacity(frame, enterFrames, exitStart, exitFrames, durationFrames);
  const x = slideFadeX(frame, enterFrames, -80, exitStart, exitFrames, -60);

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        bottom: '25%',
        opacity,
        transform: `translateX(${x}px)`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          borderLeft: `4px solid ${accent}`,
          paddingLeft: 16,
          ...(theme.lowerThird.style === 'cyber_bar'
            ? {
                background: accent,
                padding: '12px 20px',
                borderLeft: 'none',
              }
            : {}),
        }}
      >
        <p
          style={{
            margin: 0,
            color: theme.lowerThird.style === 'cyber_bar' ? theme.palette.background : '#fff',
            fontSize: 26,
            fontWeight: 700,
            fontFamily: displayFamily,
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              margin: '6px 0 0',
              color: theme.lowerThird.style === 'cyber_bar' ? theme.palette.background : theme.palette.muted,
              fontSize: 16,
              fontFamily: interFamily,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
