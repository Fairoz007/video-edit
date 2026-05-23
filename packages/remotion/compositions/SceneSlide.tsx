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
import { useVisualTemplate } from '../lib/visualTemplate';
import { LowerThird } from './LowerThird';
import type { Scene } from '../types';

export const SceneSlide: React.FC<{ scene: Scene }> = ({ scene }) => {
  const theme = useVisualTemplate();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = resolveMediaSrc(scene.src);
  const durationFrames = Math.max(1, Math.round(scene.duration * fps));

  const scaleFrom = scene.kenBurnsFrom ?? theme.bgEffects.scaleMax;
  const scaleTo = scene.kenBurnsTo ?? theme.bgEffects.scaleMin;

  const kenBurns = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: durationFrames,
    from: scaleFrom,
    to: scaleTo,
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

  const filter = colorGradeFilter(scene.colorGrade || theme.globalLut);

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    transform: `scale(${emphasisZoom}) translateX(${panX}px)`,
    filter: filter !== 'none' ? filter : undefined,
  };

  const imageStyle: React.CSSProperties = {
    ...mediaStyle,
    objectFit: 'cover',
  };

  const showLowerThird = Boolean(scene.lowerThird?.name || scene.sectionTitle);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.palette.background }}>
      {theme.filmGrain > 0 && (
        <AbsoluteFill
          style={{
            opacity: theme.filmGrain,
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      )}
      {scene.type === 'video' ? (
        <Video
          src={src}
          objectFit="cover"
          style={mediaStyle}
          trimBefore={Math.max(0, Math.round((scene.trimStart || 0) * fps))}
          playbackRate={scene.playbackRate || 1}
          loop={scene.loop}
          volume={scene.audioVolume || 0}
          muted={(scene.audioVolume || 0) <= 0}
        />
      ) : (
        <Img src={src} style={imageStyle} />
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
