import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Link,
  Youtube,
  Loader2,
  Wand2,
  Clapperboard,
  Bot,
  FileText,
  Upload,
  Download,
} from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline, type InputTab } from '../../hooks/useDocumentaryPipeline';
import { isVideoOnlyEditMode } from '../../utils/timelineSync';
import { downloadScriptTemplate } from '../../utils/api';
import { AIAssistantHints } from '../workflow/AIAssistantHints';

interface TopicInputProps {
  embedded?: boolean;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TopicInput({ embedded }: TopicInputProps) {
  const [tab, setTab] = useState<InputTab>('article');
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [scrapeInfo, setScrapeInfo] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const { data } = await downloadScriptTemplate();
      triggerBlobDownload(data, 'documentary-script-demo.txt');
    } catch {
      setScrapeInfo('Could not download template — is the backend running?');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleScriptFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const topicMatch = text.match(/^TOPIC:\s*(.+)$/im);
      const patch: { scriptText: string; topic?: string } = { scriptText: text };
      if (topicMatch && !useProjectStore.getState().input.topic?.trim()) {
        patch.topic = topicMatch[1].trim();
      }
      setInput(patch);
      setUploadName(file.name);
    };
    reader.readAsText(file);
  };

  const tabs: { id: InputTab; label: string; icon: typeof Sparkles }[] = [
    { id: 'topic', label: 'Topic', icon: Sparkles },
    { id: 'article', label: 'Article URL', icon: Link },
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'script', label: 'Upload script', icon: FileText },
  ];

  return (
    <motion.div
      className={`studio-panel-elevated border-t-0 rounded-t-none p-4 ${embedded ? '' : 'shrink-0'}`}
      layout={!embedded}
    >
      <motion.div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <motion.div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <motion.div>
              <h2 className="text-sm font-semibold text-forge-text">Documentary source</h2>
              <p className="text-xs text-forge-text-secondary mt-0.5">
                {videoOnly
                  ? 'Script → media → timeline → export'
                  : 'AI script, upload .txt, or full pipeline with narration'}
              </p>
            </motion.div>
            <button
              type="button"
              onClick={() => setShowAssistant(!showAssistant)}
              className={`btn-ghost flex items-center gap-1.5 text-xs border ${
                showAssistant ? 'border-forge-border-accent bg-forge-accent/10' : 'border-forge-border'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-forge-purple" />
              AI tips
            </button>
          </div>

          <motion.div className="flex gap-1 p-1 rounded-studio bg-forge-surface border border-forge-border flex-wrap">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 min-w-[5.5rem] flex items-center justify-center gap-1.5 py-2 rounded-[7px] text-xs font-semibold transition-all duration-200 ${
                  tab === id ? 'tab-pill-active' : 'tab-pill-inactive'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </motion.div>

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
              placeholder="Paste Wikipedia or article URL…"
              value={input.articleUrl || ''}
              onChange={(e) => setInput({ articleUrl: e.target.value })}
            />
          )}
          {tab === 'youtube' && (
            <input
              className="input-field"
              placeholder="Paste YouTube URL…"
              value={input.youtubeUrl || ''}
              onChange={(e) => setInput({ youtubeUrl: e.target.value })}
            />
          )}

          {tab === 'script' && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary flex items-center gap-2 text-xs"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                >
                  {downloadingTemplate ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Download demo template
                </button>
                <button
                  type="button"
                  className="btn-secondary flex items-center gap-2 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Choose .txt file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="hidden"
                  onChange={(e) => handleScriptFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <input
                className="input-field text-sm"
                placeholder="Optional topic override (or set TOPIC: in the file)"
                value={input.topic || ''}
                onChange={(e) => setInput({ topic: e.target.value })}
              />
              <textarea
                className="input-field min-h-[140px] max-h-[280px] text-xs font-mono leading-relaxed resize-y"
                placeholder="Paste script here, or upload a .txt file. Use [opening], [introduction], … sections with Narration: blocks — download the demo for the full format."
                value={input.scriptText || ''}
                onChange={(e) => {
                  setInput({ scriptText: e.target.value });
                  setUploadName(null);
                }}
              />
              {uploadName && (
                <p className="text-[10px] text-forge-text-secondary">Loaded: {uploadName}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <motion.button
              type="button"
              className="btn-primary flex items-center justify-center gap-2 text-sm"
              onClick={handleGenerate}
              disabled={loading || status === 'rendering'}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {tab === 'script' ? 'Use uploaded script' : 'Generate script'}
            </motion.button>
            <motion.button
              type="button"
              className="btn-secondary flex items-center justify-center gap-2 text-sm"
              onClick={handleScrapeMedia}
              disabled={scraping || status === 'rendering' || tab === 'topic' || tab === 'script'}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
              Generate scenes
            </motion.button>
            <motion.button
              type="button"
              className="btn-primary flex items-center justify-center gap-2 text-sm"
              onClick={() => startRenderFlow()}
              disabled={status === 'rendering'}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Clapperboard className="w-4 h-4" />
              {status === 'rendering' ? 'Rendering…' : 'Render'}
            </motion.button>
          </div>

          {scrapeInfo && <p className="text-xs text-sky-400/90">{scrapeInfo}</p>}
        </motion.div>

        {showAssistant && (
          <motion.div
            className="lg:w-72 shrink-0"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
          >
            <AIAssistantHints />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
