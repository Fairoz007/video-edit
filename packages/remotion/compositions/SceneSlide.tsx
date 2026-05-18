import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Video } from '@remotion/media';
import { resolveMediaSrc } from '../lib/assets';
import { LowerThird } from './LowerThird';
import type { Scene } from '../types';

export const SceneSlide: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = resolveMediaSrc(scene.src);
  const durationFrames = Math.max(1, Math.round(scene.duration * fps));

  const kenBurns = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: durationFrames,
    from: 1.06,
    to: 1,
  });

  const emphasisZoom =
    scene.transition === 'zoom'
      ? interpolate(frame, [0, durationFrames], [1.1, 1], {
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        })
      : kenBurns;

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `scale(${emphasisZoom})`,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f' }}>
      {scene.type === 'video' ? (
        <Video src={src} style={mediaStyle} muted />
      ) : (
        <Img src={src} style={mediaStyle} />
      )}
      {scene.sectionTitle && <LowerThird title={scene.sectionTitle} />}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(transparent 55%, rgba(0,0,0,0.75))',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
