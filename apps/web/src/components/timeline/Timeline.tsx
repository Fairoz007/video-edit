import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineTrack } from './TimelineTrack';
import { TimelineEmptyState } from './TimelineEmptyState';
import { useProjectStore } from '../../hooks/useProjectStore';
import { buildNarrationTrackItems, isVideoOnlyEditMode } from '../../utils/timelineSync';
import { useUiStore } from '../../hooks/useUiStore';

export function Timeline() {
  const { timeline, script, input } = useProjectStore();
  const { timelineExpanded, toggleTimeline } = useUiStore();
  const videoOnly = isVideoOnlyEditMode(input.editMode);
  const [zoom, setZoom] = useState(1);
  const [playhead, setPlayhead] = useState(0);

  const scenes = timeline?.scenes ?? [];
  const totalDuration =
    timeline?.totalDuration ||
    (script?.sections.reduce((a, s) => a + s.durationEstimate, 0) ?? 0) ||
    120;
  const playheadPercent = totalDuration ? (playhead / totalDuration) * 100 : 0;

  const videoItems =
    scenes.length > 0
      ? scenes.map((s) => ({
          id: s.id,
          start: s.start,
          duration: s.duration,
          label: s.media?.localPath?.split(/[/\\]/).pop() || s.sectionId,
          meta: formatClipMeta(s),
          color: 'from-indigo-700 via-indigo-600 to-violet-700',
          waveform: false,
        }))
      : [];

  const narrationItems = videoOnly
    ? []
    : buildNarrationTrackItems(script?.sections ?? [], scenes, totalDuration);

  const hasContent = videoItems.length > 0 || narrationItems.length > 0;

  return (
    <motion.section className="studio-panel flex flex-col shrink-0 overflow-hidden border-forge-border">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-forge-border bg-forge-surface/50 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTimeline}
            className="btn-icon p-1"
            aria-label={timelineExpanded ? 'Collapse timeline' : 'Expand timeline'}
          >
            {timelineExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <span className="section-label">Timeline</span>
        </div>
        <motion.div className="flex items-center gap-2 text-xs text-forge-text-secondary">
          <Clock className="w-3.5 h-3.5 text-forge-muted" />
          <span className="font-mono tabular-nums">{totalDuration.toFixed(1)}s</span>
          <span className="text-forge-border">|</span>
          <span>{videoItems.length} clips</span>
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {timelineExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col min-h-[200px] max-h-[min(320px,38vh)]"
          >
            <TimelineToolbar zoom={zoom} onZoomChange={setZoom} playhead={playhead} totalDuration={totalDuration} />

            {!hasContent ? (
              <TimelineEmptyState />
            ) : (
              <div
                className="flex-1 overflow-auto relative px-3 py-2 min-h-[140px] bg-forge-black/40"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left - 64;
                  const lane = rect.width - 64;
                  if (lane > 0)
                    setPlayhead(Math.max(0, Math.min(totalDuration, (x / lane) * totalDuration)));
                }}
              >
                <div className="flex justify-between mb-2 pl-16 pr-2 text-[10px] font-mono text-forge-muted tabular-nums">
                  {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                    <span key={pct}>{formatRuler(totalDuration * pct)}</span>
                  ))}
                </div>

                <motion.div
                  className="relative min-w-full space-y-1"
                  style={{ minWidth: `${Math.max(100, 100 * zoom)}%` }}
                >
                  <div className="playhead-line" style={{ left: `calc(64px + ${playheadPercent}% * (100% - 64px) / 100)` }}>
                    <motion.div className="playhead-cap" />
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-forge-cyan/90 text-[9px] font-mono font-bold text-black whitespace-nowrap">
                      {formatRuler(playhead)}
                    </div>
                  </div>

                  {videoItems.length > 0 && (
                    <TimelineTrack label="V1" items={videoItems} totalDuration={totalDuration} zoom={zoom} height={44} />
                  )}
                  {narrationItems.length > 0 && (
                    <TimelineTrack
                      label="A1"
                      items={narrationItems.map((i) => ({ ...i, waveform: true }))}
                      totalDuration={totalDuration}
                      zoom={zoom}
                      height={36}
                    />
                  )}
                  {videoItems.length > 0 && (
                    <TimelineTrack
                      label="A2"
                      items={[
                        {
                          id: 'music',
                          start: 0,
                          duration: totalDuration,
                          label: 'Background score',
                          color: 'from-sky-800 to-cyan-800',
                          waveform: true,
                        },
                      ]}
                      totalDuration={totalDuration}
                      zoom={zoom}
                      height={32}
                      locked
                    />
                  )}
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function formatRuler(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatClipMeta(scene: { trimStart?: number; trimEnd?: number; playbackRate?: number; duration: number }): string {
  const parts = [`cut ${scene.duration.toFixed(1)}s`];
  if (scene.trimStart && scene.trimStart > 0) parts.push(`in ${scene.trimStart.toFixed(1)}s`);
  if (scene.trimEnd && scene.trimEnd > 0) parts.push(`out -${scene.trimEnd.toFixed(1)}s`);
  if (scene.playbackRate && scene.playbackRate !== 1) parts.push(`${scene.playbackRate.toFixed(2)}x`);
  return parts.join(' | ');
}
