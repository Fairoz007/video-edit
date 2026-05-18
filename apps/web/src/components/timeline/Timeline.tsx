import { useProjectStore } from '../../hooks/useProjectStore';
import { TimelineTrack } from './TimelineTrack';

export function Timeline() {
  const { timeline, script } = useProjectStore();
  const scenes = timeline?.scenes ?? [];
  const totalDuration = timeline?.totalDuration ?? 60;

  return (
    <div className="glass-panel h-44 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-forge-border/50">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Timeline
        </span>
        <span className="text-xs text-gray-500 font-mono">
          {totalDuration.toFixed(1)}s · {scenes.length} clips
        </span>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-2">
        <div className="min-w-full space-y-1">
          <TimelineTrack
            label="Video"
            items={scenes.map((s) => ({
              id: s.id,
              start: s.start,
              duration: s.duration,
              label: s.media?.localPath?.split('/').pop() || s.sectionId,
              color: 'from-indigo-600 to-purple-600',
            }))}
            totalDuration={totalDuration}
          />
          <TimelineTrack
            label="Narration"
            items={(script?.sections ?? []).map((sec, i) => ({
              id: sec.id,
              start: i * (totalDuration / (script?.sections.length || 1)),
              duration: sec.durationEstimate,
              label: sec.title,
              color: 'from-emerald-600 to-teal-600',
            }))}
            totalDuration={totalDuration}
          />
          <TimelineTrack
            label="Music"
            items={[
              {
                id: 'music',
                start: 0,
                duration: totalDuration,
                label: 'Background (ducked)',
                color: 'from-amber-600 to-orange-600',
              },
            ]}
            totalDuration={totalDuration}
          />
        </div>
      </div>
    </div>
  );
}
