import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Loader2,
  Film,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getLatestExport, getProject } from '../../utils/api';
import { toExportUrl, toExportUrlDirect } from '../../utils/mediaUrl';
import { EmptyState } from '../ui/EmptyState';

function formatTimecode(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const f = Math.floor((sec % 1) * 30);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

export function VideoPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);

  const { script, outputPath, status, timeline, input, projectId, setOutputPath } =
    useProjectStore();

  const totalDuration = duration || timeline?.totalDuration || 0;

  const videoSources = useMemo(() => {
    if (!outputPath) return [];
    const primary = toExportUrl(outputPath);
    const fallback = toExportUrlDirect(outputPath);
    return primary === fallback ? [primary] : [primary, fallback];
  }, [outputPath]);

  const videoSrc = videoSources[srcIndex] ?? null;

  const syncOutputFromServer = useCallback(async () => {
    try {
      if (projectId) {
        const { data } = await getProject(projectId);
        if (data.outputPath) {
          setOutputPath(data.outputPath);
          return;
        }
      }
      const { data } = await getLatestExport();
      if (data.outputPath) setOutputPath(data.outputPath);
    } catch {
      /* ignore */
    }
  }, [projectId, setOutputPath]);

  useEffect(() => {
    if (!outputPath && (status === 'completed' || projectId)) {
      syncOutputFromServer();
    }
  }, [outputPath, status, projectId, syncOutputFromServer]);

  useEffect(() => {
    setPlayError(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSrcIndex(0);
    setLoading(Boolean(outputPath));
  }, [outputPath]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => setPlayError(true));
    else el.pause();
  }, [playing, videoSrc]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) el.muted = muted;
  }, [muted]);

  const handleVideoError = () => {
    if (srcIndex + 1 < videoSources.length) {
      setSrcIndex((i) => i + 1);
      setPlayError(false);
      setLoading(true);
      return;
    }
    setPlayError(true);
    setLoading(false);
  };

  const seek = (delta: number) => {
    const el = videoRef.current;
    if (!el || !videoSrc) return;
    const max = el.duration || totalDuration || 9999;
    el.currentTime = Math.max(0, Math.min(max, el.currentTime + delta));
    setCurrentTime(el.currentTime);
  };

  const seekToPercent = (pct: number) => {
    const el = videoRef.current;
    if (!el?.duration) return;
    el.currentTime = pct * el.duration;
    setCurrentTime(el.currentTime);
  };

  const openExport = () => {
    if (!outputPath) return;
    window.docuforge?.showItemInFolder(outputPath);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const topic = script?.topic || input.topic || 'Untitled documentary';
  const isRendering = status === 'rendering';
  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <motion.section className="h-full min-h-[200px] flex flex-col studio-panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-forge-border shrink-0 bg-gradient-subtle">
        <div className="flex items-center gap-3">
          <span className="section-label">Program monitor</span>
          {outputPath && !isRendering && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/12 text-emerald-400 border border-emerald-500/20">
              Ready
            </span>
          )}
          {isRendering && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-forge-accent/15 text-forge-glow flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Rendering
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-forge-muted tabular-nums">
          {formatTimecode(currentTime)}
          {duration > 0 ? ` / ${formatTimecode(duration)}` : ''}
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative m-3 rounded-studio-lg overflow-hidden bg-black border border-forge-border min-h-[200px]"
      >
        {videoSrc && !playError ? (
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-contain"
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            onLoadStart={() => setLoading(true)}
            onLoadedData={() => {
              setLoading(false);
              setPlayError(false);
            }}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
              setCurrentTime(0);
              setLoading(false);
            }}
            onError={handleVideoError}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
        ) : playError && outputPath ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <EmptyState
              compact
              icon={Film}
              title="Preview unavailable"
              description="The export exists on disk — open it in your default player."
              action={
                <button type="button" onClick={openExport} className="btn-primary text-xs flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Reveal in folder
                </button>
              }
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-forge-navy via-forge-surface to-black flex flex-col items-center justify-center p-6">
            {loading && outputPath ? (
              <Loader2 className="w-8 h-8 text-forge-muted animate-spin mb-3" />
            ) : null}
            <EmptyState
              compact
              icon={Film}
              title={topic}
              description={
                isRendering
                  ? 'Your export will appear here when rendering completes.'
                  : 'Generate a script, assemble scenes, then render to preview your documentary.'
              }
              hint={isRendering ? undefined : 'Tip: collapse Source panel below when you need more preview space'}
            />
          </div>
        )}

        {loading && videoSrc && !playError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <Loader2 className="w-8 h-8 text-forge-text animate-spin" />
          </div>
        )}
      </div>

      <motion.div className="px-4 pb-4 space-y-3 shrink-0">
        <motion.div
          className="relative h-1.5 rounded-full bg-forge-surface border border-forge-border overflow-hidden cursor-pointer group"
          role="slider"
          aria-label="Timeline scrubber"
          aria-valuenow={progressPct}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seekToPercent((e.clientX - rect.left) / rect.width);
          }}
        >
          <motion.div
            className="h-full accent-gradient relative"
            style={{ width: `${progressPct}%` }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-card opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPct}% - 6px)` }}
          />
        </motion.div>

        <div className="flex items-center justify-between gap-2">
          <motion.div className="flex items-center gap-0.5">
            <button
              type="button"
              className="btn-icon"
              onClick={() => seek(-1 / 30)}
              disabled={!videoSrc || playError}
              aria-label="Previous frame"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => seek(-5)}
              disabled={!videoSrc || playError}
              aria-label="Skip back 5s"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <motion.button
              type="button"
              onClick={() => videoSrc && !playError && setPlaying(!playing)}
              disabled={!videoSrc || playError || loading}
              className="w-11 h-11 mx-1 rounded-full accent-gradient flex items-center justify-center disabled:opacity-40"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </motion.button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => seek(5)}
              disabled={!videoSrc || playError}
              aria-label="Skip forward 5s"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => seek(1 / 30)}
              disabled={!videoSrc || playError}
              aria-label="Next frame"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setMuted(!muted)}
              disabled={!videoSrc || playError}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {outputPath && (
              <button type="button" onClick={openExport} className="btn-icon" aria-label="Reveal in folder">
                <FolderOpen className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              className="btn-icon"
              onClick={toggleFullscreen}
              disabled={!videoSrc || playError}
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
