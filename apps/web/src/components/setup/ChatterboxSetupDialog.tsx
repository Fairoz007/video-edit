import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  Loader2,
  Package,
  RefreshCw,
  SkipForward,
  X,
} from 'lucide-react';

const PYTHON_URL = 'https://www.python.org/downloads/windows/';

type Phase = 'loading' | 'prompt' | 'installing' | 'done' | 'error';

interface SetupRequirement {
  id: string;
  label: string;
  ready: boolean;
  required: boolean;
  detail?: string;
}

export function ChatterboxSetupDialog() {
  const api = window.docuforge;
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [requirements, setRequirements] = useState<SetupRequirement[]>([]);
  const [pythonFound, setPythonFound] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const loadStatus = useCallback(async () => {
    if (!api) return;
    const status = await api.getDocuForgeSetupStatus();
    setRequirements(status.requirements);
    setPythonFound(status.pythonFound);
    return status;
  }, [api]);

  useEffect(() => {
    if (!api) return;

    let cancelled = false;
    (async () => {
      const should = await api.shouldPromptDocuForgeSetup();
      if (cancelled) return;
      if (should) {
        await loadStatus();
        if (cancelled) return;
        setOpen(true);
        setPhase('prompt');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, loadStatus]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logLines]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSkip = useCallback(async () => {
    await api?.skipDocuForgeSetup();
    close();
  }, [api, close]);

  const handleRefreshPython = useCallback(async () => {
    if (!api) return;
    const r = await api.refreshSetupPython();
    setPythonFound(r.pythonFound);
    await loadStatus();
  }, [api, loadStatus]);

  const handleInstall = useCallback(async () => {
    if (!api) return;
    setPhase('installing');
    setError(null);
    setLogLines([]);

    const unsub = api.onDocuForgeSetupLog((line) => {
      setLogLines((prev) => {
        const next = [...prev, line];
        return next.length > 300 ? next.slice(-300) : next;
      });
    });

    try {
      const result = await api.runDocuForgeSetup();
      if (result.status) {
        setRequirements(result.status.requirements);
      }
      if (result.ok) {
        setPhase('done');
        await loadStatus();
      } else {
        setError(result.error || 'Setup failed');
        setPhase('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setPhase('error');
    } finally {
      unsub();
    }
  }, [api, loadStatus]);

  if (!api || !open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="docuforge-setup-title"
      >
        <motion.div
          className="studio-panel-elevated w-full max-w-lg p-6 shadow-float border border-forge-border/80 max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-300">
              <Package className="w-6 h-6" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h2 id="docuforge-setup-title" className="text-lg font-semibold text-forge-text">
                Install required components
              </h2>
              <p className="text-sm text-forge-muted mt-1 leading-relaxed">
                DocuForge needs a one-time setup on your PC: Python packages, local voice models,
                browser for scraping, and FFmpeg for export. This can take 10–30 minutes depending
                on your connection.
              </p>
            </div>
            {phase === 'prompt' && (
              <button
                type="button"
                onClick={handleSkip}
                className="p-1.5 rounded-lg text-forge-muted hover:text-forge-text hover:bg-white/5"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <ul className="mb-4 space-y-2">
            {requirements.map((req) => (
              <li
                key={req.id}
                className="flex items-start gap-2 text-sm text-forge-text-secondary"
              >
                {req.ready ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : phase === 'installing' ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-forge-muted shrink-0 mt-0.5" />
                )}
                <span>
                  <span className={req.ready ? 'text-forge-text' : ''}>{req.label}</span>
                  {req.detail && (
                    <span className="block text-xs text-forge-muted mt-0.5">{req.detail}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {phase === 'prompt' && !pythonFound && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-sm text-amber-100/90">
              <p className="font-medium text-amber-50 mb-1">Python required first</p>
              <p>
                Install Python 3.11 or newer with &quot;Add python.exe to PATH&quot; checked, then
                click Refresh below.
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-amber-200 hover:text-white underline-offset-2 hover:underline"
                  onClick={() => api.openExternalUrl(PYTHON_URL)}
                >
                  Download Python
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-amber-200 hover:text-white"
                  onClick={handleRefreshPython}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>
            </div>
          )}

          {(phase === 'installing' || phase === 'error' || phase === 'done') && (
            <div className="mb-4 rounded-lg border border-forge-border bg-black/40 max-h-36 overflow-y-auto p-3 font-mono text-xs text-forge-muted">
              {logLines.length === 0 ? (
                <p>Installing components…</p>
              ) : (
                logLines.map((line, i) => (
                  <div key={`${i}-${line.slice(0, 24)}`} className="whitespace-pre-wrap break-all">
                    {line}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          )}

          {phase === 'error' && error && (
            <p className="mb-3 text-sm text-red-300/90">{error}</p>
          )}

          {phase === 'done' && (
            <p className="mb-4 text-sm text-emerald-300/90">
              All required components are installed. You can create documentaries with local voice
              narration and export video.
            </p>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            {phase === 'prompt' && (
              <>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-forge-muted hover:text-forge-text hover:bg-white/5"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip (cloud voice only)
                </button>
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={!pythonFound}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Download className="w-4 h-4" />
                  Install everything
                </button>
              </>
            )}
            {phase === 'installing' && (
              <p className="text-sm text-forge-muted py-2 w-full text-center">
                Please keep this window open until setup finishes.
              </p>
            )}
            {(phase === 'done' || phase === 'error') && (
              <>
                {phase === 'error' && (
                  <button
                    type="button"
                    onClick={async () => {
                      setPhase('prompt');
                      setError(null);
                      setLogLines([]);
                      await loadStatus();
                    }}
                    className="px-4 py-2 rounded-lg text-sm text-forge-muted hover:bg-white/5"
                  >
                    Try again
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {phase === 'done' ? 'Continue' : 'Close'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
