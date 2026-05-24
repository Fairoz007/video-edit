import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Clock, Layers } from 'lucide-react';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineTrack } from './TimelineTrack';
import { TimelineEmptyState } from './TimelineEmptyState';
import { useProjectStore } from '../../hooks/useProjectStore';
import {
  buildNarrationTrackItems,
  isVideoOnlyEditMode,
  resolveIntroOffsetSec,
} from '../../utils/timelineSync';
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
          trackType: 'video' as const,
          waveform: false,
        }))
      : [];

  const introOffsetSec = resolveIntroOffsetSec(timeline, input.templateId);
  const narrationItems = videoOnly
    ? []
    : buildNarrationTrackItems(script?.sections ?? [], scenes, totalDuration, introOffsetSec).map(
        (i) => ({ ...i, trackType: 'narration' as const }),
      );

  const hasContent = videoItems.length > 0 || narrationItems.length > 0;

  return (
    <motion.section className="glass-panel-elevated flex flex-col h-full min-h-[220px] overflow-hidden">
      <div className="panel-header shrink-0 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTimeline}
            className="btn-icon p-1.5"
            aria-label={timelineExpanded ? 'Collapse timeline' : 'Expand timeline'}
          >
            {timelineExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <Layers className="w-4 h-4 text-forge-glow" />
          <div>
            <p className="panel-eyebrow">Sequence</p>
            <p className="panel-title">Timeline</p>
          </div>
        </div>
        <motion.div className="flex items-center gap-2 text-xs text-forge-text-secondary">
          <Clock className="w-3.5 h-3.5 text-forge-muted" />
          <span className="font-mono tabular-nums font-medium">{formatRuler(totalDuration)}</span>
          <span className="text-forge-border">·</span>
          <span>{videoItems.length} clips</span>
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {timelineExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col flex-1 min-h-[200px] max-h-[min(380px,42vh)]"
          >
            <TimelineToolbar
              zoom={zoom}
              onZoomChange={setZoom}
              playhead={playhead}
              totalDuration={totalDuration}
            />

            {!hasContent ? (
              <TimelineEmptyState />
            ) : (
              <div
                className="flex-1 overflow-auto relative px-3 py-3 min-h-[160px]"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(3,3,4,0.6) 100%)',
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left - 56;
                  const lane = rect.width - 56;
                  if (lane > 0)
                    setPlayhead(Math.max(0, Math.min(totalDuration, (x / lane) * totalDuration)));
                }}
              >
                <div className="flex justify-between mb-2 pl-14 pr-2 text-[10px] font-mono text-forge-muted tabular-nums border-b border-forge-border/30 pb-2">
                  {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                    <span key={pct}>{formatRuler(totalDuration * pct)}</span>
                  ))}
                </div>

                <motion.div
                  className="relative min-w-full space-y-2"
                  style={{ minWidth: `${Math.max(100, 100 * zoom)}%` }}
                >
                  <div
                    className="playhead-line"
                    style={{ left: `calc(56px + ${playheadPercent}% * (100% - 56px) / 100)` }}
                  >
                    <motion.div className="playhead-cap" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-forge-cyan/95 text-[9px] font-mono font-bold text-black whitespace-nowrap shadow-glow-sm">
                      {formatRuler(playhead)}
                    </div>
                  </div>

                  {videoItems.length > 0 && (
                    <TimelineTrack
                      label="V1"
                      items={videoItems}
                      totalDuration={totalDuration}
                      zoom={zoom}
                      height={52}
                    />
                  )}
                  {narrationItems.length > 0 && (
                    <TimelineTrack
                      label="A1"
                      items={narrationItems.map((i) => ({ ...i, waveform: true }))}
                      totalDuration={totalDuration}
                      zoom={zoom}
                      height={40}
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
                          trackType: 'audio' as const,
                          waveform: true,
                        },
                      ]}
                      totalDuration={totalDuration}
                      zoom={zoom}
                      height={36}
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

function formatClipMeta(scene: {
  trimStart?: number;
  trimEnd?: number;
  playbackRate?: number;
  duration: number;
}): string {
  const parts = [`${scene.duration.toFixed(1)}s`];
  if (scene.trimStart && scene.trimStart > 0) parts.push(`in ${scene.trimStart.toFixed(1)}s`);
  if (scene.trimEnd && scene.trimEnd > 0) parts.push(`out −${scene.trimEnd.toFixed(1)}s`);
  if (scene.playbackRate && scene.playbackRate !== 1) parts.push(`${scene.playbackRate.toFixed(2)}×`);
  return parts.join(' · ');
}
