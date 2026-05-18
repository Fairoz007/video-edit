import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Link,
  Youtube,
  Loader2,
  Wand2,
  Clapperboard,
  Bot,
  ChevronDown,
} from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { WorkflowPipeline } from '../generation/WorkflowPipeline';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline, type InputTab } from '../../hooks/useDocumentaryPipeline';
import { isVideoOnlyEditMode } from '../../utils/timelineSync';

export function TopicInput() {
  const [tab, setTab] = useState<InputTab>('article');
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeInfo, setScrapeInfo] = useState<string | null>(null);
  const { status, input, setInput } = useProjectStore();
  const { generateScriptFlow, scrapeMediaFlow, startRenderFlow } = useDocumentaryPipeline();
  const videoOnly = isVideoOnlyEditMode(input.editMode);

  const handleGenerate = async () => {
    setLoading(true);
    await generateScriptFlow(tab);
    setLoading(false);
  };

  const handleScrapeMedia = async () => {
    setScraping(true);
    const msg = await scrapeMediaFlow(tab);
    if (msg) setScrapeInfo(msg);
    setScraping(false);
  };

  const tabs: { id: InputTab; label: string; icon: typeof Sparkles; short: string }[] = [
    { id: 'topic', label: 'Topic', short: 'Topic', icon: Sparkles },
    { id: 'article', label: 'Article URL', short: 'URL', icon: Link },
    { id: 'youtube', label: 'YouTube', short: 'YT', icon: Youtube },
  ];

  return (
    <GlassPanel className="p-3 sm:p-4 shrink-0" layout={false}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            AI Documentary Generator
          </h2>
          <p className="text-[10px] text-gray-600">
            {videoOnly
              ? 'Script → Media → Timeline (video only) → Render'
              : 'Script → Media → Narration → Timeline → Render'}
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost flex items-center gap-1 text-[11px] border border-forge-border/40 self-start"
        >
          <Bot className="w-3.5 h-3.5 text-forge-purple" />
          <span className="hidden sm:inline">AI Assistant</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-1.5 mb-3 p-1 rounded-xl bg-black/40 border border-forge-border/30">
        {tabs.map(({ id, label, short, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
              tab === id ? 'tab-pill-active' : 'tab-pill-inactive'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        {tab === 'topic' && (
          <input
            className="input-field flex-1 min-w-0"
            placeholder='e.g. "The Rise of Emirates Airlines"'
            value={input.topic || ''}
            onChange={(e) => setInput({ topic: e.target.value })}
          />
        )}
        {tab === 'article' && (
          <input
            className="input-field flex-1 min-w-0"
            placeholder="Paste Wikipedia or article URL..."
            value={input.articleUrl || ''}
            onChange={(e) => setInput({ articleUrl: e.target.value })}
          />
        )}
        {tab === 'youtube' && (
          <input
            className="input-field flex-1 min-w-0"
            placeholder="Paste YouTube URL..."
            value={input.youtubeUrl || ''}
            onChange={(e) => setInput({ youtubeUrl: e.target.value })}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <motion.button
          type="button"
          className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5"
          onClick={handleGenerate}
          disabled={loading || status === 'rendering'}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Generate Script
        </motion.button>
        <motion.button
          type="button"
          className="btn-ghost flex items-center justify-center gap-2 border border-forge-border/50 text-xs py-2.5"
          onClick={handleScrapeMedia}
          disabled={scraping || status === 'rendering' || tab === 'topic'}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
          Generate Scenes
        </motion.button>
        <motion.button
          type="button"
          className="btn-primary flex items-center justify-center gap-2 text-xs py-2.5"
          onClick={() => startRenderFlow()}
          disabled={status === 'rendering'}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Clapperboard className="w-4 h-4" />
          {status === 'rendering' ? 'Rendering…' : 'Render'}
        </motion.button>
      </div>

      {scrapeInfo && <p className="text-[10px] text-forge-cyan/80 mb-3">{scrapeInfo}</p>}

      <div className="overflow-x-auto -mx-1 px-1">
        <WorkflowPipeline />
      </div>
    </GlassPanel>
  );
}
