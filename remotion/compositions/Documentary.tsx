import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from 'remotion';
import { IntroGraphic } from './IntroGraphic';
import { OutroGraphic } from './OutroGraphic';
import { LowerThird } from './LowerThird';
import { AnimatedSubtitle, type SubtitleCue } from './AnimatedSubtitle';
import { MotionAccent } from './MotionAccent';

export interface Scene {
  src: string;
  type?: 'image' | 'video';
  duration: number;
  caption?: string;
  sectionTitle?: string;
  transition?: 'fade' | 'crossfade' | 'slide' | 'zoom';
}

export interface DocumentaryProps {
  title: string;
  sections: { id: string; title: string; narration: string }[];
  scenes: Scene[];
  subtitleCues?: SubtitleCue[];
  totalDuration?: number;
  introGraphicSec?: number;
  outroGraphicSec?: number;
  channelName?: string;
}

const SceneSlide: React.FC<{ scene: Scene; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationFrames = Math.round(scene.duration * fps);
  const transition = scene.transition || (index % 2 === 0 ? 'crossfade' : 'slide');

  const fadeIn = transition === 'zoom' ? 20 : 15;
  const fadeOut = fadeIn;

  const opacity = interpolate(
    frame,
    [0, fadeIn, durationFrames - fadeOut, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const kenBurns = spring({
    frame,
    fps,
    config: { damping: 200 },
    from: 1.08,
    to: 1,
  });

  const slideX =
    transition === 'slide'
      ? interpolate(frame, [0, fadeIn], [80, 0], { extrapolateRight: 'clamp' })
      : 0;

  const zoomScale =
    transition === 'zoom'
      ? interpolate(frame, [0, durationFrames], [1.12, 1], { extrapolateRight: 'clamp' })
      : kenBurns;

  const src =
    scene.src.startsWith('http://') ||
    scene.src.startsWith('https://') ||
    scene.src.startsWith('/') ||
    /^[A-Za-z]:\\/.test(scene.src)
      ? scene.src
      : staticFile(scene.src);

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: `translateX(${slideX}px) scale(${zoomScale})`,
  };

  return (
    <AbsoluteFill style={{ opacity, backgroundColor: '#0a0a0f' }}>
      {scene.type === 'video' ? (
        <video src={src} style={mediaStyle} muted />
      ) : (
        <Img src={src} style={mediaStyle} />
      )}
      {scene.sectionTitle && <LowerThird title={scene.sectionTitle} />}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.8))',
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
        }}
      />
    </AbsoluteFill>
  );
};

export const DocumentaryComposition: React.FC<DocumentaryProps> = ({
  title,
  scenes,
  subtitleCues = [],
  introGraphicSec = 5,
  outroGraphicSec = 8,
  channelName = 'DocuForge',
  totalDuration = 180,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const introFrames = Math.round(introGraphicSec * fps);
  const outroFrames = Math.round(outroGraphicSec * fps);
  const contentFrames = Math.max(fps, durationInFrames - introFrames - outroFrames);

  const sceneDurationTotal = scenes.reduce((a, s) => a + s.duration, 0) || 1;
  const scale = contentFrames / fps / sceneDurationTotal;

  let offset = introFrames;
  const transitions: Scene['transition'][] = ['crossfade', 'slide', 'zoom', 'fade'];

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0f' }}>
      <Sequence from={0} durationInFrames={introFrames}>
        <IntroGraphic title={title} subtitle="A Documentary" />
      </Sequence>

      {scenes.map((scene, i) => {
        const dur = Math.max(fps, Math.round(scene.duration * scale * fps));
        const from = offset;
        offset += dur;
        const sceneWithTransition = {
          ...scene,
          transition: scene.transition || transitions[i % transitions.length],
        };
        return (
          <Sequence key={`scene-${i}`} from={from} durationInFrames={dur}>
            <SceneSlide scene={sceneWithTransition} index={i} />
          </Sequence>
        );
      })}

      <Sequence from={durationInFrames - outroFrames} durationInFrames={outroFrames}>
        <OutroGraphic channelName={channelName} />
      </Sequence>

      <MotionAccent />
      {subtitleCues.length > 0 && <AnimatedSubtitle cues={subtitleCues} />}
    </AbsoluteFill>
  );
};
