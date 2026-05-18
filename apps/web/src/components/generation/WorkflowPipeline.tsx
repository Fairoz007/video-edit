import { FileText, Image, Mic, Layers, Rocket } from 'lucide-react';
import { WorkflowCard } from '../ui/WorkflowCard';
import { useProjectStore } from '../../hooks/useProjectStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function WorkflowPipeline() {
  const { script, media, timeline, status, progress } = useProjectStore();

  const sectionCount = script?.sections.length ?? 0;
  const mediaCount = media.length;
  const narrationSec =
    script?.sections.reduce((a, s) => a + (s.durationEstimate ?? 0), 0) ?? 0;
  const sceneCount = timeline?.scenes.length ?? 0;

  const scriptProgress = sectionCount > 0 ? 100 : 0;
  const mediaProgress = mediaCount > 0 ? Math.min(100, mediaCount * 2) : sectionCount > 0 ? 35 : 0;
  const narrationProgress = narrationSec > 0 ? 100 : sectionCount > 0 ? 50 : 0;
  const timelineProgress = sceneCount > 0 ? 100 : script ? 60 : 0;
  const renderProgress =
    status === 'completed' ? 100 : status === 'rendering' ? progress : status === 'generating' ? 40 : 0;

  const cards = [
    {
      step: 1,
      title: 'Script',
      subtitle: sectionCount ? `${sectionCount} sections` : 'Awaiting generation',
      progress: scriptProgress,
      status: (status === 'generating' && !sectionCount
        ? 'processing'
        : sectionCount
          ? 'complete'
          : 'idle') as const,
      icon: FileText,
    },
    {
      step: 2,
      title: 'Media',
      subtitle: mediaCount ? `${mediaCount} assets` : 'Scrape or fetch',
      progress: mediaProgress,
      status: (mediaCount ? 'complete' : sectionCount ? 'active' : 'idle') as const,
      icon: Image,
    },
    {
      step: 3,
      title: 'Narration',
      subtitle: narrationSec ? formatDuration(narrationSec) : 'TTS pipeline',
      progress: narrationProgress,
      status: (narrationSec ? 'complete' : sectionCount ? 'active' : 'idle') as const,
      icon: Mic,
    },
    {
      step: 4,
      title: 'Timeline',
      subtitle: sceneCount ? `${sceneCount} scenes` : 'Auto-arrange',
      progress: timelineProgress,
      status: (sceneCount ? 'complete' : script ? 'active' : 'idle') as const,
      icon: Layers,
    },
    {
      step: 5,
      title: 'Render',
      subtitle:
        status === 'completed'
          ? 'Ready'
          : status === 'rendering'
            ? `${progress}%`
            : 'Queue',
      progress: renderProgress,
      status: (status === 'rendering'
        ? 'processing'
        : status === 'completed'
          ? 'complete'
          : timeline || script
            ? 'active'
            : 'idle') as const,
      icon: Rocket,
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
      {cards.map((c) => (
        <WorkflowCard key={c.step} {...c} />
      ))}
    </div>
  );
}
