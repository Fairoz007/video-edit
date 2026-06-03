import { motion } from 'framer-motion';
import { Search, Upload, Filter, Image as ImageIcon } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { mediaDisplayUrl, type MediaAsset } from '../../utils/mediaUrl';
import { MediaDropZone } from '../media/MediaDropZone';
import { EmptyState } from '../ui/EmptyState';

const FILTERS = ['All', 'Videos', 'Images', 'Audio'] as const;

export function MediaLibraryPanel() {
  const { media, keywords } = useProjectStore();
  const items = media as MediaAsset[];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-forge-text">Media library</h3>
        <p className="text-xs text-forge-text-secondary mt-0.5">{items.length} assets in bin</p>
      </div>

      <MediaDropZone compact />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-muted" />
        <input className="input-field pl-9 text-sm" placeholder="Search media…" />
      </div>

      <div className="flex gap-1">
        {FILTERS.map((f, i) => (
          <button
            key={f}
            type="button"
            className={`flex-1 py-1.5 rounded-studio text-[10px] font-semibold uppercase tracking-wide transition-all ${
              i === 0
                ? 'accent-gradient text-white'
                : 'text-forge-muted bg-forge-surface hover:text-forge-text-secondary border border-forge-border'
            }`}
          >
            {f}
          </button>
        ))}
        <button type="button" className="p-2 rounded-studio bg-forge-surface border border-forge-border text-forge-muted hover:text-forge-text">
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>

      {keywords && (
        <div className="p-3 rounded-studio-lg bg-forge-surface border border-forge-border">
          <p className="text-label-sm text-forge-muted mb-2">AI keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.keywords.slice(0, 10).map((kw) => (
              <span
                key={kw}
                className="text-[10px] px-2 py-0.5 rounded-md bg-forge-accent/15 text-forge-glow border border-forge-border-accent"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {items.map((m, i) => {
          const src = mediaDisplayUrl(m);
          return (
            <motion.div
              key={m.localPath || m.url || i}
              whileHover={{ scale: 1.02 }}
              className="aspect-video rounded-studio bg-forge-surface border border-forge-border overflow-hidden relative group cursor-pointer"
            >
              {src ? (
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-forge-navy">
                  <ImageIcon className="w-5 h-5 text-forge-muted" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-forge-text-secondary truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {m.source || m.filename || 'asset'}
              </div>
            </motion.div>
          );
        })}
      </div>

      {items.length === 0 && (
        <EmptyState
          compact
          icon={ImageIcon}
          title="No media yet"
          description="Run Generate Scenes after your script is ready, or import files via drag and drop."
          hint="Stock footage is fetched from Pexels and Pixabay automatically"
        />
      )}

      <button
        type="button"
        className="w-full py-2.5 rounded-studio border border-dashed border-forge-border-strong text-sm font-medium text-forge-text-secondary hover:text-forge-text hover:border-forge-border-accent flex items-center justify-center gap-2 transition-all"
      >
        <Upload className="w-4 h-4" />
        Import media
      </button>
    </div>
  );
}
