import { Download, Trash2 } from 'lucide-react';

const PLACEHOLDER_DOWNLOADS = [
  { id: '1', name: 'pexels-aerial-city.jpg', size: '2.4 MB', status: 'complete' },
  { id: '2', name: 'pixabay-timelapse.mp4', size: '18 MB', status: 'complete' },
];

export function DownloadsPanel() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3">Downloads</h3>
      <ul className="space-y-2">
        {PLACEHOLDER_DOWNLOADS.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-forge-border/20"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate text-gray-300">{d.name}</p>
              <p className="text-[10px] text-gray-600">{d.size}</p>
            </div>
            <button type="button" className="text-gray-600 hover:text-red-400">
              <Trash2 className="w-3 h-3" />
            </button>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-gray-600 mt-3">
        Parallel downloads cached in /cache
      </p>
    </div>
  );
}
