import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../ui/GlassPanel';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineTrack } from './TimelineTrack';
import { useProjectStore } from '../../hooks/useProjectStore';

export function Timeline() {
  const { timeline, script } = useProjectStore();
  const [zoom, setZoom] = useState(1);
  const [playhead, setPlayhead] = useState(0);

  const scenes = timeline?.scenes ?? [];
  const totalDuration = timeline?.totalDuration || (script?.sections.reduce((a, s) => a + s.durationEstimate, 0) ?? 0) || 120;
  const playheadPercent = totalDuration ? (playhead / totalDuration) * 100 : 0;

  const videoItems =
    scenes.length > 0
      ? scenes.map((s) => ({
          id: s.id,
          start: s.start,
          duration: s.duration,
          label: s.media?.localPath?.split(/[/\\]/).pop() || s.sectionId,
          color: 'from-indigo-600 via-purple-600 to-violet-700',
        }))
      : [];

  const narrationItems = (script?.sections ?? []).map((sec, i, arr) => ({
    id: sec.id,
    start: i * (totalDuration / Math.max(arr.length, 1)),
    duration: sec.durationEstimate,
    label: sec.title,
    color: 'from-emerald-600 to-teal-600',
    waveform: true,
  }));

  const hasContent = videoItems.length > 0 || narrationItems.length > 0;

  return (
    <GlassPanel className="h-[min(220px,35vh)] min-h-[160px] flex flex-col shrink-0 overflow-hidden" layout={false}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-forge-border/40 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
          Multi-Track Timeline
        </span>
        <span className="text-[10px] font-mono text-forge-cyan/80">
          {totalDuration.toFixed(0)}s · {videoItems.length} clips
        </span>
      </div>

      <TimelineToolbar zoom={zoom} onZoomChange={setZoom} />

      {!hasContent ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-600 px-4 text-center">
          Timeline fills in after Generate Scenes or when a render builds the edit
        </div>
      ) : (
        <div
          className="flex-1 overflow-auto relative px-2 py-2 min-h-0"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - 80;
            const lane = rect.width - 80;
            if (lane > 0) setPlayhead(Math.max(0, Math.min(totalDuration, (x / lane) * totalDuration)));
          }}
        >
          <motion.div
            className="relative min-w-[min(100%,600px)] space-y-1"
            style={{ minWidth: `${100 * zoom}%` }}
          >
            <div className="playhead-line" style={{ left: `calc(72px + ${playheadPercent}% * (100% - 72px) / 100)` }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md accent-gradient text-[8px] font-mono font-bold text-white whitespace-nowrap shadow-glow-sm">
                {Math.floor(playhead / 60)}:{String(Math.floor(playhead % 60)).padStart(2, '0')}
              </div>
            </div>

            {videoItems.length > 0 && (
              <TimelineTrack label="Video" items={videoItems} totalDuration={totalDuration} zoom={1} />
            )}
            {narrationItems.length > 0 && (
              <TimelineTrack
                label="Narration"
                items={narrationItems}
                totalDuration={totalDuration}
                zoom={1}
              />
            )}
            {videoItems.length > 0 && (
              <TimelineTrack
                label="Music"
                items={[
                  {
                    id: 'music',
                    start: 0,
                    duration: totalDuration,
                    label: 'Background',
                    color: 'from-blue-600 to-cyan-600',
                    waveform: true,
                  },
                ]}
                totalDuration={totalDuration}
                zoom={1}
                locked
              />
            )}
          </motion.div>
        </div>
      )}
    </GlassPanel>
  );
}
