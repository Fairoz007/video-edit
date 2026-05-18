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
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { useProjectStore } from '../../hooks/useProjectStore';
import { getLatestExport, getProject } from '../../utils/api';
import { toExportUrl, toExportUrlDirect } from '../../utils/mediaUrl';

function formatTimecode(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

  const topic = script?.topic || input.topic || 'Your documentary';
  const isRendering = status === 'rendering';

  return (
    <GlassPanel className="flex-1 min-h-[180px] sm:min-h-[220px] flex flex-col overflow-hidden" layout>
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-forge-border/40 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
          Preview
        </span>
        <div className="flex items-center gap-1.5">
          {outputPath && !isRendering && (
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Ready
            </span>
          )}
          {isRendering && (
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-forge-accent/20 text-forge-glow animate-pulse">
              Rendering…
            </span>
          )}
          {loading && outputPath && (
            <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-gray-400 flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Loading
            </span>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative m-2 sm:m-3 rounded-2xl overflow-hidden bg-black border border-forge-border/30 min-h-[140px]"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-400/90 px-4">
            <p className="text-sm font-medium">Preview could not load in the app</p>
            <p className="text-xs text-gray-500 mt-1 mb-3">The export file exists — open it locally.</p>
            <button
              type="button"
              onClick={openExport}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Open file
            </button>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex flex-col items-center justify-center p-4 text-center">
            <Sparkles className="w-8 h-8 text-forge-purple/50 mb-3" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-forge-cyan/70 mb-2">
              {isRendering ? 'Rendering' : 'Awaiting export'}
            </p>
            <h2 className="text-base sm:text-xl font-bold text-white tracking-tight line-clamp-2">
              {topic}
            </h2>
            <p className="text-[10px] text-gray-500 mt-2 max-w-xs">
              {isRendering
                ? 'Preview appears when the pipeline finishes'
                : 'Generate a script, then Render Documentary'}
            </p>
          </div>
        )}
      </div>

      <div className="px-3 sm:px-4 pb-3 space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-1 rounded-full bg-black/50 overflow-hidden cursor-pointer"
            role="slider"
            aria-label="Seek"
            onClick={(e) => {
              const el = videoRef.current;
              if (!el?.duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              el.currentTime = pct * el.duration;
            }}
          >
            <motion.div
              className="h-full accent-gradient transition-all"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-gray-500 tabular-nums shrink-0">
            {formatTimecode(currentTime)}
            {duration > 0 ? ` / ${formatTimecode(duration)}` : ''}
          </span>
        </div>

        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
          <button
            type="button"
            className="btn-icon p-1.5"
            onClick={() => seek(-1 / 30)}
            disabled={!videoSrc || playError}
            aria-label="Previous frame"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="btn-icon p-1.5"
            onClick={() => seek(-5)}
            disabled={!videoSrc || playError}
            aria-label="Skip back"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <motion.button
            type="button"
            onClick={() => videoSrc && !playError && setPlaying(!playing)}
            disabled={!videoSrc || playError || loading}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full accent-gradient flex items-center justify-center shadow-glow disabled:opacity-40"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </motion.button>
          <button
            type="button"
            className="btn-icon p-1.5"
            onClick={() => seek(5)}
            disabled={!videoSrc || playError}
            aria-label="Skip forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="btn-icon p-1.5"
            onClick={() => seek(1 / 30)}
            disabled={!videoSrc || playError}
            aria-label="Next frame"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="btn-icon p-1.5"
            onClick={() => setMuted(!muted)}
            disabled={!videoSrc || playError}
            aria-label="Mute"
          >
            <Volume2 className={`w-4 h-4 ${muted ? 'opacity-40' : ''}`} />
          </button>
          {outputPath && (
            <button
              type="button"
              onClick={openExport}
              className="btn-icon p-1.5"
              aria-label="Reveal in folder"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            className="btn-icon p-1.5"
            onClick={toggleFullscreen}
            disabled={!videoSrc || playError}
            aria-label="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassPanel>
  );
}
