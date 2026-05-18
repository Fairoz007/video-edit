import { motion } from 'framer-motion';
import { Search, Upload, Filter, Image as ImageIcon, Video, Music } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { mediaDisplayUrl, type MediaAsset } from '../../utils/mediaUrl';

const FILTERS = ['All', 'Videos', 'Images', 'Audio'] as const;

export function MediaLibraryPanel() {
  const { media, keywords } = useProjectStore();
  const items = media as MediaAsset[];

  return (
    <div>
      <h3 className="text-sm font-bold text-white mb-0.5">Media Library</h3>
      <p className="text-[10px] text-gray-500 mb-3">{items.length} assets</p>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input className="input-field pl-8 py-2 text-xs" placeholder="Search media..." />
      </div>

      <div className="flex gap-1 mb-3">
        {FILTERS.map((f, i) => (
          <button
            key={f}
            type="button"
            className={`flex-1 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wide transition-all ${
              i === 0 ? 'accent-gradient text-white' : 'text-gray-500 bg-white/5 hover:text-gray-300'
            }`}
          >
            {f}
          </button>
        ))}
        <button type="button" className="p-1.5 rounded-lg bg-white/5 text-gray-500 hover:text-white">
          <Filter className="w-3 h-3" />
        </button>
      </div>

      {keywords && (
        <div className="mb-3 p-2 rounded-xl bg-black/30 border border-forge-border/30">
          <p className="text-[9px] text-gray-500 uppercase mb-1.5">AI Keywords</p>
          <div className="flex flex-wrap gap-1">
            {keywords.keywords.slice(0, 10).map((kw) => (
              <span
                key={kw}
                className="text-[9px] px-1.5 py-0.5 rounded-md bg-forge-accent/20 text-forge-glow border border-forge-accent/20"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        {items.map((m, i) => {
          const src = mediaDisplayUrl(m);
          return (
            <motion.div
              key={m.localPath || m.url || i}
              whileHover={{ scale: 1.03 }}
              className="aspect-video rounded-xl bg-black/50 border border-forge-border/40 overflow-hidden relative group"
            >
              {src ? (
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-950/50 to-purple-950/50">
                  <ImageIcon className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 p-1 bg-black/70 text-[8px] text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {m.source || m.filename || 'asset'}
              </div>
            </motion.div>
          );
        })}
        {items.length === 0 && (
          <p className="col-span-2 text-xs text-gray-600 text-center py-4">
            Run Generate Scenes or render to fetch media
          </p>
        )}
      </div>

      <button
        type="button"
        className="w-full py-3 rounded-xl border border-dashed border-forge-border-bright/40 text-xs font-medium text-gray-400 hover:text-white hover:border-forge-accent/50 flex items-center justify-center gap-2 transition-all"
      >
        <Upload className="w-4 h-4" />
        Import Media
      </button>
    </div>
  );
}
