import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Video } from '@remotion/media';
import { resolveMediaSrc } from '../lib/assets';
import { colorGradeFilter } from '../lib/colorGrade';
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
    from: scene.kenBurnsFrom ?? 1.06,
    to: scene.kenBurnsTo ?? 1,
  });

  const panX = interpolate(frame, [0, durationFrames], [scene.panStartX ?? 0, scene.panEndX ?? 0], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

  const emphasisZoom =
    scene.transition === 'zoom'
      ? interpolate(frame, [0, durationFrames], [1.1, 1], {
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        })
      : kenBurns;

  const filter = colorGradeFilter(scene.colorGrade);

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `scale(${emphasisZoom}) translateX(${panX}px)`,
    filter: filter !== 'none' ? filter : undefined,
  };

  const showLowerThird = Boolean(scene.lowerThird?.name || scene.sectionTitle);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f' }}>
      {scene.type === 'video' ? (
        <Video src={src} style={mediaStyle} muted />
      ) : (
        <Img src={src} style={mediaStyle} />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(transparent 55%, rgba(0,0,0,0.75))',
          pointerEvents: 'none',
        }}
      />
      {showLowerThird && (
        <Sequence from={scene.lowerThird?.fromFrame ?? 12} durationInFrames={scene.lowerThird?.durationFrames ?? 100}>
          <LowerThird
            title={scene.lowerThird?.name || scene.sectionTitle || ''}
            subtitle={scene.lowerThird?.title}
            durationFrames={scene.lowerThird?.durationFrames ?? 100}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
