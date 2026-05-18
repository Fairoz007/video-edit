import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Image,
  Download,
  LayoutTemplate,
  ChevronRight,
} from 'lucide-react';
import { ProjectsPanel } from '../panels/ProjectsPanel';
import { MediaLibraryPanel } from '../panels/MediaLibraryPanel';
import { DownloadsPanel } from '../panels/DownloadsPanel';
import { TemplatesPanel } from '../panels/TemplatesPanel';

const NAV = [
  { id: 'projects', label: 'Projects', icon: FolderOpen, panel: ProjectsPanel },
  { id: 'media', label: 'Media Library', icon: Image, panel: MediaLibraryPanel },
  { id: 'downloads', label: 'Downloads', icon: Download, panel: DownloadsPanel },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate, panel: TemplatesPanel },
] as const;

export function LeftSidebar() {
  const [active, setActive] = useState<string>('projects');
  const [collapsed, setCollapsed] = useState(false);
  const ActivePanel = NAV.find((n) => n.id === active)?.panel ?? ProjectsPanel;

  return (
    <aside
      className={`flex border-r border-forge-border bg-black/30 transition-all ${
        collapsed ? 'w-14' : 'w-64'
      }`}
    >
      <nav className="w-14 flex flex-col items-center py-3 gap-1 border-r border-forge-border/50">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => {
              setActive(id);
              setCollapsed(false);
            }}
            className={`p-2.5 rounded-lg transition-colors ${
              active === id
                ? 'bg-forge-accent/20 text-forge-glow'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="mt-auto p-2 text-gray-600 hover:text-white"
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </nav>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 208, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            <div className="p-3 h-full overflow-y-auto">
              <ActivePanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
