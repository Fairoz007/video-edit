import { Composition } from 'remotion';
import { DocumentaryComposition, type DocumentaryProps } from './compositions/Documentary';
import { TitleCard } from './compositions/TitleCard';

const DEFAULT_DURATION_SEC = 180;
const FPS = 30;

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
          introGraphicSec: 5,
          outroGraphicSec: 8,
          channelName: 'DocuForge',
        }}
        calculateMetadata={({ props }) => {
          const p = props as DocumentaryProps;
          const totalSec = p.totalDuration || DEFAULT_DURATION_SEC;
          return {
            durationInFrames: Math.round(totalSec * FPS),
            fps: FPS,
            width: 1920,
            height: 1080,
          };
        }}
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
