import { VideoPreview } from '../preview/VideoPreview';
import { Timeline } from '../timeline/Timeline';
import { RenderProgress } from '../render/RenderProgress';
import { TopicInput } from '../input/TopicInput';

export function CenterWorkspace() {
  return (
    <div className="flex-1 flex flex-col min-w-0 p-3 gap-3">
      <TopicInput />
      <VideoPreview />
      <Timeline />
      <RenderProgress />
    </div>
  );
}
