import { Composition, type CalculateMetadataFunction } from 'remotion';
import {
  DocumentaryComposition,
  calculateDocumentaryContentFrames,
  type DocumentaryProps,
} from './compositions/Documentary';
import { TitleCard } from './compositions/TitleCard';
import { WalkthroughComposition } from './compositions/walkthrough/WalkthroughComposition';
import { sumSceneDurationsWithTransitions } from './lib/duration';
import type { TransitionKind } from './lib/transitions';
import type { WalkthroughProps } from './types';

const DEFAULT_DURATION_SEC = 180;
const FPS = 30;
const WALKTHROUGH_DEFAULT_SEC_PER_SCREEN = 4;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Documentary"
        component={DocumentaryComposition}
        durationInFrames={DEFAULT_DURATION_SEC * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'Documentary',
          sections: [],
          scenes: [],
          subtitleCues: [],
          totalDuration: DEFAULT_DURATION_SEC,
          introGraphicSec: 3,
          outroGraphicSec: 8,
          channelName: 'DocuForge',
        }}
        calculateMetadata={documentaryMetadata}
      />
      <Composition
        id="Walkthrough"
        component={WalkthroughComposition}
        durationInFrames={FPS * 30}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          projectName: 'Walkthrough',
          screens: [],
        }}
        calculateMetadata={walkthroughMetadata}
      />
      <Composition
        id="TitleCard"
        component={TitleCard}
        durationInFrames={90}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ title: 'DocuForge', subtitle: '' }}
      />
    </>
  );
};

const documentaryMetadata: CalculateMetadataFunction<DocumentaryProps> = ({ props }) => {
  const p = props as DocumentaryProps;
  const fps = FPS;
  const introSec = p.introGraphicSec ?? 5;
  const outroSec = p.outroGraphicSec ?? 8;
  const totalSec = p.totalDuration || DEFAULT_DURATION_SEC;
  const contentSec = Math.max(1, totalSec - introSec - outroSec);
  const sceneDurationTotal = (p.scenes || []).reduce((a, s) => a + s.duration, 0) || 1;
  const scale = contentSec / sceneDurationTotal;
  const contentFrames = calculateDocumentaryContentFrames(p.scenes || [], fps, scale);
  const durationInFrames = Math.round(introSec * fps) + contentFrames + Math.round(outroSec * fps);

  return {
    durationInFrames: Math.max(fps * 10, durationInFrames),
    fps,
    width: 1920,
    height: 1080,
  };
};

const walkthroughMetadata: CalculateMetadataFunction<WalkthroughProps> = ({ props }) => {
  const p = props as WalkthroughProps;
  const fps = p.fps || FPS;
  const screens = p.screens || [];

  if (!screens.length) {
    return {
      durationInFrames: fps * 10,
      fps,
      width: p.width || 1920,
      height: p.height || 1080,
    };
  }

  const durations = screens.map((s) =>
    Math.max(fps, Math.round((s.duration || WALKTHROUGH_DEFAULT_SEC_PER_SCREEN) * fps)),
  );
  const transitions: TransitionKind[] = screens.map(
    (s, i) => (s.transition || (['fade', 'slide', 'fade', 'wipe'][i % 4])) as TransitionKind,
  );

  const durationInFrames = sumSceneDurationsWithTransitions(durations, fps, transitions);

  return {
    durationInFrames: Math.max(fps * 5, durationInFrames),
    fps,
    width: p.width || 1920,
    height: p.height || 1080,
  };
};
