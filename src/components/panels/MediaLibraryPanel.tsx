import { useProjectStore } from '../../hooks/useProjectStore';

export function MediaLibraryPanel() {
  const { media, keywords } = useProjectStore();

  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">Media Library</h3>
      {keywords && (
        <div className="mb-3">
          <p className="text-[10px] text-gray-500 uppercase mb-1">Keywords</p>
          <div className="flex flex-wrap gap-1">
            {keywords.keywords.slice(0, 12).map((kw) => (
              <span
                key={kw}
                className="text-[10px] px-1.5 py-0.5 rounded bg-forge-accent/20 text-forge-glow"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(media as { thumb?: string; source?: string }[]).map((m, i) => (
          <div
            key={i}
            className="aspect-video rounded-lg bg-black/50 border border-forge-border/30 overflow-hidden"
          >
            {m.thumb ? (
              <img src={m.thumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600">
                {m.source || 'asset'}
              </div>
            )}
          </div>
        ))}
        {media.length === 0 && (
          <p className="col-span-2 text-xs text-gray-600">Media appears after pipeline runs</p>
        )}
      </div>
    </div>
  );
}
