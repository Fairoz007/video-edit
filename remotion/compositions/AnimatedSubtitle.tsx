import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SubtitleCue {
  text: string;
  startSec: number;
  endSec: number;
}

export interface AnimatedSubtitleProps {
  cues: SubtitleCue[];
}

function wrapSubtitle(text: string, maxChars = 48) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + w).length > maxChars) {
      if (line) lines.push(line.trim());
      line = `${w} `;
    } else {
      line += `${w} `;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 2).join('\n');
}

export const AnimatedSubtitle: React.FC<AnimatedSubtitleProps> = ({ cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  const active = cues.find((c) => timeSec >= c.startSec && timeSec < c.endSec);
  if (!active) return null;

  const localFrame = Math.round((timeSec - active.startSec) * fps);
  const durationFrames = Math.max(1, Math.round((active.endSec - active.startSec) * fps));

  const bounce = spring({
    frame: localFrame,
    fps,
    config: { damping: 11, stiffness: 180, mass: 0.7 },
  });

  const jumpY = interpolate(bounce, [0, 1], [48, 0], { extrapolateRight: 'clamp' });
  const opacity = interpolate(
    localFrame,
    [0, 6, durationFrames - 8, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const scale = interpolate(bounce, [0, 1], [0.88, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 72,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity,
        transform: `translateY(${jumpY}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          maxWidth: '82%',
          padding: '14px 28px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(15,15,25,0.92), rgba(30,27,75,0.88))',
          border: '1px solid rgba(129,140,248,0.45)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 24px rgba(99,102,241,0.25)',
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#f8fafc',
            fontSize: 34,
            fontWeight: 700,
            lineHeight: 1.35,
            whiteSpace: 'pre-line',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {wrapSubtitle(active.text)}
        </p>
      </div>
    </div>
  );
};
