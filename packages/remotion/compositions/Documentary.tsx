import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { resolveMediaSrc } from '../lib/assets';
import { TransitionSeries } from '@remotion/transitions';
import { sumSceneDurationsWithTransitions } from '../lib/duration';
import type { TransitionKind } from '../lib/transitions';
import {
  mapTemplateTransitionType,
  transitionPresentation,
  transitionTiming,
} from '../lib/transitions';
import { VisualTemplateRoot } from '../lib/TemplateContext';
import {
  DEFAULT_VISUAL_THEME,
  useVisualTemplate,
  type VisualTheme,
} from '../lib/visualTemplate';
import type { ChapterBadgeSpec, Scene, WordCue } from '../types';
import { IntroGraphic } from './IntroGraphic';
import { OutroGraphic } from './OutroGraphic';
import { AnimatedSubtitle, type SubtitleCue } from './AnimatedSubtitle';
import { KineticSubtitles } from './KineticSubtitles';
import { MotionAccent } from './MotionAccent';
import { SceneSlide } from './SceneSlide';
import { GlobalProgressBar } from './GlobalProgressBar';
import { CornerBrackets } from './CornerBrackets';
import { ChapterBadgeLayer } from './ChapterBadge';

export type { Scene };

export interface DocumentaryProps {
  title: string;
  sections: { id: string; title: string; narration: string }[];
  scenes: Scene[];
  subtitleCues?: SubtitleCue[];
  wordCues?: WordCue[];
  chapterBadges?: ChapterBadgeSpec[];
  visualTheme?: VisualTheme;
  totalDuration?: number;
  introGraphicSec?: number;
  outroGraphicSec?: number;
  channelName?: string;
  narrationAudioSrc?: string;
}

const DocumentaryScenes: React.FC<{
  scenes: Scene[];
  scale: number;
}> = ({ scenes, scale }) => {
  const { fps } = useVideoConfig();
  const theme = useVisualTemplate();
  const transitionFrames = theme.transitions.durationFrames;

  if (!scenes.length) return null;

  const prepared = scenes.map((scene, i) => ({
    ...scene,
    duration: Math.max(2.5, scene.duration * scale),
    transition: (scene.transition ||
      mapTemplateTransitionType(
        i % 2 === 0 ? theme.transitions.defaultType : 'crossfade',
      )) as TransitionKind,
  }));

  const durations = prepared.map((s) => Math.max(fps, Math.round(s.duration * fps)));
  const transitions = prepared.map((s) => s.transition as TransitionKind);

  return (
    <TransitionSeries>
      {prepared.map((scene, index) => {
        const durationInFrames = durations[index];
        const transitionKind = transitions[index];

        return (
          <React.Fragment key={`scene-${index}-${scene.src.slice(-24)}`}>
            <TransitionSeries.Sequence durationInFrames={durationInFrames}>
              <SceneSlide scene={scene} />
            </TransitionSeries.Sequence>
            {index < prepared.length - 1 && (
              <TransitionSeries.Transition
                presentation={transitionPresentation(transitionKind) as never}
                timing={transitionTiming(transitionKind, transitionFrames)}
              />
            )}
          </React.Fragment>
        );
      })}
    </TransitionSeries>
  );
};

const DocumentaryInner: React.FC<DocumentaryProps> = ({
  title,
  scenes,
  subtitleCues = [],
  wordCues = [],
  chapterBadges = [],
  introGraphicSec,
  outroGraphicSec = 8,
  channelName = 'DocuForge',
  narrationAudioSrc,
}) => {
  const theme = useVisualTemplate();
  const { fps, durationInFrames } = useVideoConfig();
  const introFrames = Math.round(
    (introGraphicSec ?? theme.intro.durationFrames / fps) * fps,
  );
  const outroFrames = Math.round(outroGraphicSec * fps);
  const contentFrames = Math.max(fps, durationInFrames - introFrames - outroFrames);

  const sceneDurationTotal = scenes.reduce((a, s) => a + s.duration, 0) || 1;
  const scale = contentFrames / fps / sceneDurationTotal;
  const useKinetic = wordCues.length > 0;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.palette.background }}>
      <Sequence from={0} durationInFrames={introFrames}>
        <IntroGraphic title={title} subtitle="A DocuForge Documentary" channelName={channelName} />
      </Sequence>

      <Sequence from={introFrames} durationInFrames={contentFrames}>
        <DocumentaryScenes scenes={scenes} scale={scale} />
      </Sequence>

      <Sequence from={durationInFrames - outroFrames} durationInFrames={outroFrames}>
        <OutroGraphic channelName={channelName} />
      </Sequence>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent ${Math.round((1 - theme.vignette) * 100)}%, rgba(0,0,0,${theme.vignette}) 100%)`,
          pointerEvents: 'none',
        }}
      />
      <GlobalProgressBar />
      <CornerBrackets />
      <MotionAccent />
      {chapterBadges.length > 0 && <ChapterBadgeLayer badges={chapterBadges} />}

      {useKinetic ? (
        <KineticSubtitles wordCues={wordCues} />
      ) : (
        subtitleCues.length > 0 && <AnimatedSubtitle cues={subtitleCues} />
      )}

      {narrationAudioSrc && (
        <Sequence from={introFrames}>
          <Audio src={resolveMediaSrc(narrationAudioSrc)} volume={1} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

export const DocumentaryComposition: React.FC<DocumentaryProps> = (props) => {
  const theme = props.visualTheme || DEFAULT_VISUAL_THEME;
  return (
    <VisualTemplateRoot theme={theme}>
      <DocumentaryInner {...props} />
    </VisualTemplateRoot>
  );
};

export function calculateDocumentaryContentFrames(
  scenes: Scene[],
  fps: number,
  scale: number,
): number {
  if (!scenes.length) return fps;
  const prepared = scenes.map((s, i) => ({
    duration: Math.max(2.5, s.duration * scale),
    transition: (s.transition || (['crossfade', 'crossfade', 'slide', 'wipe'][i % 4])) as TransitionKind,
  }));
  const durations = prepared.map((s) => Math.max(fps, Math.round(s.duration * fps)));
  const transitions = prepared.map((s) => s.transition);
  return sumSceneDurationsWithTransitions(durations, fps, transitions);
}
