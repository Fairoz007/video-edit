import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Film, Image as ImageIcon, Music } from 'lucide-react';

interface MediaDropZoneProps {
  compact?: boolean;
  onFiles?: (files: FileList) => void;
}

export function MediaDropZone({ compact, onFiles }: MediaDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length && onFiles) {
        onFiles(e.dataTransfer.files);
      }
    },
    [onFiles],
  );

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative rounded-studio-lg border-2 border-dashed transition-all duration-200 ${
        dragOver
          ? 'border-forge-accent/50 bg-forge-accent/5'
          : 'border-forge-border hover:border-forge-border-strong bg-forge-surface/40'
      } ${compact ? 'py-4 px-3' : 'py-8 px-4'}`}
      whileHover={{ scale: 1.005 }}
    >
      <AnimatePresence>
        {dragOver && (
          <motion.div
            className="absolute inset-0 rounded-studio-lg bg-forge-accent/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-center text-center gap-2">
        <motion.div className="flex gap-2 text-forge-muted">
          <Film className="w-4 h-4" />
          <ImageIcon className="w-4 h-4" />
          <Music className="w-4 h-4" />
        </motion.div>
        <Upload className={`text-forge-muted ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
        <p className={`font-medium text-forge-text ${compact ? 'text-xs' : 'text-sm'}`}>
          Drop media here
        </p>
        <p className="text-xs text-forge-muted max-w-[200px]">
          Video, images, or audio — or click Import in the library
        </p>
      </div>
    </motion.div>
  );
}
