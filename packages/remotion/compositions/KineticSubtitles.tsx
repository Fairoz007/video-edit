import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { interFamily } from '../lib/fonts';
import { useVisualTemplate } from '../lib/visualTemplate';

export interface WordCue {
  word: string;
  startSec: number;
  endSec: number;
}

export interface KineticSubtitlesProps {
  wordCues: WordCue[];
}

export const KineticSubtitles: React.FC<KineticSubtitlesProps> = ({ wordCues }) => {
  const theme = useVisualTemplate();
  const subs = theme.subtitles;
  const position = subs.position || subs.layout?.position || 'bottom_center';
  const marginBottom = subs.marginBottom ?? subs.layout?.marginBottom ?? 80;
  const marginLeft = subs.marginLeft ?? subs.layout?.marginLeft ?? 0;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  const active = wordCues.find((c) => timeSec >= c.startSec && timeSec < c.endSec);
  if (!active) return null;

  const localFrame = Math.round((timeSec - active.startSec) * fps);
  const cueDurationSec = Math.max(0.05, (active.endSec - active.startSec) || 0.2);
  const durationFrames = Math.max(1, Math.round(cueDurationSec * fps));

  const isCenter = position === 'center' || position === 'center_dynamic';
  const isLeft = position === 'bottom_left' || position === 'bottom_left_offset';

  let y = 0;
  let x = 0;
  let opacity = 1;
  let scale = 1;

  if (subs.enterAnimation === 'slam_scale') {
    scale = interpolate(localFrame, [0, 3], [1.8, 1], {
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    opacity = interpolate(localFrame, [0, 2], [0, 1], { extrapolateRight: 'clamp' });
    if (localFrame >= durationFrames - 2) opacity = 0;
  } else if (subs.enterAnimation === 'fade_slide_right') {
    x = interpolate(localFrame, [0, 8], [12, 0], { extrapolateRight: 'clamp' });
    opacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
    if (localFrame >= durationFrames - 6) {
      opacity = interpolate(localFrame, [durationFrames - 6, durationFrames], [1, 0], {
        extrapolateRight: 'clamp',
      });
    }
  } else {
    const enterY = interpolate(localFrame, [0, 4], [18, 0], {
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    });
    const exitY =
      localFrame >= durationFrames - 3
        ? interpolate(localFrame, [durationFrames - 3, durationFrames], [0, -12], {
            extrapolateRight: 'clamp',
          })
        : enterY;
    y = exitY;
    opacity =
      localFrame >= durationFrames - 3
        ? interpolate(localFrame, [durationFrames - 3, durationFrames], [1, 0], {
            extrapolateRight: 'clamp',
          })
        : interpolate(localFrame, [0, 4], [0, 1], { extrapolateRight: 'clamp' });
  }

  const containerStyle: React.CSSProperties = isCenter
    ? {
        top: '42%',
        bottom: 'auto',
        left: 0,
        right: 0,
        justifyContent: 'center',
      }
    : isLeft
      ? {
          bottom: marginBottom,
          left: marginLeft,
          right: 'auto',
          justifyContent: 'flex-start',
        }
      : {
          bottom: marginBottom,
          left: 0,
          right: 0,
          justifyContent: 'center',
        };

  const bg = subs.background;
  const stroke = subs.stroke;

  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        pointerEvents: 'none',
        opacity,
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        ...containerStyle,
      }}
    >
      <div
        style={{
          padding: bg?.enabled ? '8px 20px' : 0,
          borderRadius: bg?.borderRadius ?? bg?.border_radius ?? 8,
          background: bg?.enabled ? bg.color : 'transparent',
          boxShadow: subs.textShadow,
        }}
      >
        <span
          style={{
            color: subs.highlightColor,
            fontSize: subs.fontSize,
            fontWeight: subs.fontWeight as React.CSSProperties['fontWeight'],
            fontStyle: subs.fontStyle as React.CSSProperties['fontStyle'],
            fontFamily: interFamily,
            textTransform: subs.textTransform as React.CSSProperties['textTransform'],
            letterSpacing: subs.letterSpacing ?? 1,
            WebkitTextStroke: stroke?.enabled ? `${stroke.width}px ${stroke.color}` : undefined,
          }}
        >
          {active.word}
        </span>
      </div>
    </div>
  );
};
