import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Maximize2, FolderOpen } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useProjectStore } from '../../hooks/useProjectStore';

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playError, setPlayError] = useState(false);
  const { script, outputPath, status } = useProjectStore();

  const videoSrc = useMemo(() => {
    if (!outputPath || status !== 'completed') return null;
    const name = encodeURIComponent(outputPath.split('/').pop() || '');
    return `http://127.0.0.1:3847/exports/${name}?v=${encodeURIComponent(outputPath)}`;
  }, [outputPath, status]);

  useEffect(() => {
    setPlayError(false);
    setPlaying(false);
  }, [videoSrc]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => setPlayError(true));
    else el.pause();
  }, [playing, videoSrc]);

  const openExport = () => {
    if (!outputPath) return;
    window.docuforge?.showItemInFolder(outputPath);
  };

  return (
    <motion.div
      className="glass-panel flex-1 min-h-[200px] flex flex-col"
      layout
    >
      <motion.div className="flex items-center justify-between px-3 py-2 border-b border-forge-border/50" layout={false}>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Preview
        </span>
        <span className="text-xs text-forge-glow truncate max-w-[55%]">
          {script?.topic || 'No project loaded'}
        </span>
      </motion.div>

      <div className="flex-1 relative bg-black/60 m-3 rounded-lg overflow-hidden flex items-center justify-center">
        {videoSrc && !playError ? (
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            className="max-h-full max-w-full"
            controls
            playsInline
            preload="metadata"
            onError={() => setPlayError(true)}
            onEnded={() => setPlaying(false)}
          />
        ) : playError && outputPath ? (
          <motion.div className="text-center text-amber-400/90 px-4">
            <p className="text-sm font-medium">In-app preview unavailable</p>
            <p className="text-xs mt-1 text-gray-500 mb-3">
              The file may still be fine — open it in your default player.
            </p>
            <button
              type="button"
              onClick={openExport}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-forge-accent/20 text-forge-glow hover:bg-forge-accent/30"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Show in Finder
            </button>
          </motion.div>
        ) : (
          <motion.div className="text-center text-gray-600">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-forge-border flex items-center justify-center">
              <Play className="w-8 h-8 text-forge-accent ml-1" />
            </div>
            <p className="text-sm">Preview will appear after rendering</p>
            <p className="text-xs mt-1 text-gray-700">Remotion + FFmpeg pipeline</p>
          </motion.div>
        )}

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-forge-border/50">
        <button type="button" className="text-gray-500 hover:text-white" aria-label="Skip back">
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => videoSrc && setPlaying(!playing)}
          disabled={!videoSrc || playError}
          className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center shadow-glow disabled:opacity-40"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button type="button" className="text-gray-500 hover:text-white" aria-label="Skip forward">
          <SkipForward className="w-4 h-4" />
        </button>
        {outputPath && (
          <button
            type="button"
            onClick={openExport}
            className="text-gray-500 hover:text-forge-glow ml-auto"
            aria-label="Show export in folder"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        )}
        <button type="button" className="text-gray-500 hover:text-white" aria-label="Fullscreen">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
