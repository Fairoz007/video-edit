import { useCallback, useEffect, useState } from 'react';
import { Mic, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { healthCheck, listVoices } from '../../utils/api';
import { useProjectStore } from '../../hooks/useProjectStore';

function formatVoiceError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return 'Backend not reachable. Run npm run dev:backend (or npm run dev with Electron).';
    }
    const msg = err.response?.data?.error;
    if (typeof msg === 'string') return msg;
  }
  return err instanceof Error ? err.message : 'Could not load voices';
}

export function VoiceSettings() {
  const { voiceSettings, setVoiceSettings } = useProjectStore();
  const [voices, setVoices] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const platform =
    typeof window !== 'undefined' ? window.docuforge?.platform || 'darwin' : 'darwin';

  const loadVoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await healthCheck();
      const { data } = await listVoices();
      const list = data.voices?.map((v) => ({ id: v.id, label: v.label || v.name })) || [];
      setVoices(list);
      const current = useProjectStore.getState().voiceSettings.voice;
      if (data.defaultVoice && !current) {
        setVoiceSettings({ voice: data.defaultVoice });
      } else if (list.length && !list.some((v) => v.id === current)) {
        setVoiceSettings({ voice: data.defaultVoice || list[0].id });
      }
    } catch (err) {
      setError(formatVoiceError(err));
      setVoices([]);
    } finally {
      setLoading(false);
    }
  }, [setVoiceSettings]);

  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  return (
    <section className="glass-panel p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase mb-3">
        <Mic className="w-3.5 h-3.5 text-forge-accent" />
        Voice (Local TTS)
      </h3>

      {loading && (
        <p className="flex items-center gap-2 text-[10px] text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading system voices…
        </p>
      )}

      {error && (
        <div className="mb-2">
          <p className="text-[10px] text-red-400 mb-2">{error}</p>
          <button
            type="button"
            onClick={() => loadVoices()}
            className="flex items-center gap-1 text-[10px] text-forge-accent hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <label className="block text-[10px] text-gray-500 mb-1">Voice</label>
          <select
            className="input-field text-xs mb-2 w-full"
            value={voiceSettings.voice || voices[0]?.id || ''}
            onChange={(e) => setVoiceSettings({ voice: e.target.value })}
            disabled={!voices.length}
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <label className="block text-[10px] text-gray-500 mb-1">
            Rate ({voiceSettings.rate} WPM)
          </label>
          <input
            type="range"
            min={120}
            max={220}
            value={voiceSettings.rate}
            onChange={(e) => setVoiceSettings({ rate: Number(e.target.value) })}
            className="w-full accent-forge-accent"
          />
          <p className="text-[10px] text-gray-600 mt-1">
            {platform === 'darwin' && 'macOS system voices via `say`'}
            {platform === 'win32' && 'Windows installed voices via System.Speech'}
            {platform === 'linux' && 'Linux espeak voices'}
          </p>
        </>
      )}
    </section>
  );
}
