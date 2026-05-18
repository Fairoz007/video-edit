import { motion } from 'framer-motion';
import { VideoPreview } from '../preview/VideoPreview';
import { Timeline } from '../timeline/Timeline';
import { RenderProgress } from '../render/RenderProgress';
import { TopicInput } from '../input/TopicInput';

export function CenterWorkspace() {
  return (
    <motion.div className="flex-1 flex flex-col min-w-0 py-2 pr-1 sm:pr-2 gap-2 sm:gap-2.5 min-h-0 overflow-y-auto overflow-x-hidden">
      <TopicInput />
      <VideoPreview />
      <Timeline />
      <RenderProgress />
    </motion.div>
  );
}
