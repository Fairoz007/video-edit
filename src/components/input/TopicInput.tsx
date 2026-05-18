import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Link, Youtube, Loader2 } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import {
  generateScript,
  extractKeywords,
  startRender,
  scrapeUrlFull,
} from '../../utils/api';
import { useRenderPolling } from '../../hooks/useRenderPolling';
import { isValidHttpUrl, normalizeHttpUrlInput } from '../../utils/urls';

type Tab = 'topic' | 'article' | 'youtube';

export function TopicInput() {
  const [tab, setTab] = useState<Tab>('topic');
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeInfo, setScrapeInfo] = useState<string | null>(null);
  const {
    input,
    setInput,
    setScript,
    setKeywords,
    setStatus,
    setProjectId,
    projectId,
    exportOptions,
    voiceSettings,
    status,
  } = useProjectStore();

  useRenderPolling(projectId, status === 'rendering');

  const handleGenerate = async () => {
    const urlField = tab === 'article' ? input.articleUrl : tab === 'youtube' ? input.youtubeUrl : undefined;
    if (urlField?.trim() && !isValidHttpUrl(urlField)) {
      setScrapeInfo('Enter a valid http:// or https:// URL (not .env text or comments).');
      return;
    }

    setLoading(true);
    setStatus('generating');
    try {
      const { data: script } = await generateScript({
        ...input,
        articleUrl: normalizeHttpUrlInput(input.articleUrl),
        youtubeUrl: normalizeHttpUrlInput(input.youtubeUrl),
      });
      setScript(script);
      const { data: kw } = await extractKeywords({
        text: script.fullNarration,
        topic: input.topic || script.topic,
        articleUrl: normalizeHttpUrlInput(input.articleUrl),
        youtubeUrl: normalizeHttpUrlInput(input.youtubeUrl),
      });
      setKeywords(kw);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setStatus('idle');
    }
  };

  const sourceUrl =
    tab === 'article' ? input.articleUrl : tab === 'youtube' ? input.youtubeUrl : undefined;

  const handleScrapeMedia = async () => {
    if (!sourceUrl) return;
    if (!isValidHttpUrl(sourceUrl)) {
      setScrapeInfo('Enter a valid http:// or https:// URL (not .env text or comments).');
      return;
    }
    setScraping(true);
    setScrapeInfo(null);
    try {
      const { data } = await scrapeUrlFull(sourceUrl, input.topic);
      const count = data.media?.length ?? 0;
      const title = data.content?.title || 'Page';
      setScrapeInfo(`Scraped ${count} asset(s) from "${title}"`);
      if (!input.topic && data.content?.title) {
        setInput({ topic: data.content.title.slice(0, 80) });
      }
    } catch (err) {
      console.error(err);
      setScrapeInfo('Scrape failed — check URL and backend logs');
    } finally {
      setScraping(false);
    }
  };

  const handleRender = async () => {
    const urlField = tab === 'article' ? input.articleUrl : tab === 'youtube' ? input.youtubeUrl : undefined;
    if (urlField?.trim() && !isValidHttpUrl(urlField)) {
      setScrapeInfo('Enter a valid http:// or https:// URL (not .env text or comments).');
      return;
    }

    setStatus('rendering');
    try {
      const { data } = await startRender({
        input: {
          ...input,
          articleUrl: normalizeHttpUrlInput(input.articleUrl),
          youtubeUrl: normalizeHttpUrlInput(input.youtubeUrl),
          voice: voiceSettings.voice,
          rate: voiceSettings.rate,
        },
        options: {
          ...exportOptions,
          voice: voiceSettings.voice,
          rate: voiceSettings.rate,
        },
      });
      setProjectId(data.projectId);
    } catch (err) {
      console.error(err);
      setStatus('failed');
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: 'topic', label: 'Topic', icon: Sparkles },
    { id: 'article', label: 'Article URL', icon: Link },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
  ];

  return (
    <div className="glass-panel p-4">
      <div className="flex gap-2 mb-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === id
                ? 'accent-gradient text-white'
                : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'topic' && (
        <input
          className="input-field"
          placeholder='e.g. "The Rise of Emirates Airlines"'
          value={input.topic || ''}
          onChange={(e) => setInput({ topic: e.target.value })}
        />
      )}
      {tab === 'article' && (
        <input
          className="input-field"
          placeholder="Paste article URL..."
          value={input.articleUrl || ''}
          onChange={(e) => setInput({ articleUrl: e.target.value })}
        />
      )}
      {tab === 'youtube' && (
        <input
          className="input-field"
          placeholder="Paste YouTube URL..."
          value={input.youtubeUrl || ''}
          onChange={(e) => setInput({ youtubeUrl: e.target.value })}
        />
      )}

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Script
        </button>
        <motion.button
          type="button"
          className="btn-primary flex-1"
          onClick={handleRender}
          disabled={status === 'rendering'}
          whileTap={{ scale: 0.98 }}
        >
          {status === 'rendering' ? 'Rendering...' : 'Create Documentary'}
        </motion.button>
      </div>

      {(tab === 'article' || tab === 'youtube') && sourceUrl && (
        <button
          type="button"
          className="mt-2 w-full py-2 rounded-lg text-xs font-medium bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          onClick={handleScrapeMedia}
          disabled={scraping}
        >
          {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
          Preview scrape (Playwright)
        </button>
      )}
      {scrapeInfo && <p className="mt-2 text-xs text-gray-400">{scrapeInfo}</p>}
    </div>
  );
}
