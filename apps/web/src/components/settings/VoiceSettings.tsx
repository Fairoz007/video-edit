import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Loader2, RefreshCw, Play } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { healthCheck, listVoices, previewVoice, getVoicePreviewStatus } from '../../utils/api';
import { useProjectStore } from '../../hooks/useProjectStore';

function formatVoiceError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return 'Backend not reachable. Run npm run dev:backend.';
    }
    const msg = err.response?.data?.error;
    if (typeof msg === 'string') return msg;
  }
  return err instanceof Error ? err.message : 'Could not load voices';
}

export function VoiceSettings() {
  const { voiceSettings, setVoiceSettings } = useProjectStore();
  const [voices, setVoices] = useState<
    { id: string; label: string; previewUrl?: string; previewReady?: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [ttsDevice, setTtsDevice] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<{
    warming: boolean;
    complete: boolean;
    ready: number;
    total: number;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pollPreviewCache = useCallback(async () => {
    try {
      const { data } = await getVoicePreviewStatus();
      setCacheStatus(data);
      if (!data.complete && (data.warming || data.ready < data.total)) {
        const { data: voiceData } = await listVoices();
        setVoices(
          voiceData.voices?.map((v) => ({
            id: v.id,
            label: v.label || v.name,
            previewUrl: v.previewUrl,
            previewReady: v.previewReady,
          })) || [],
        );
      }
      return data.complete;
    } catch {
      return false;
    }
  }, []);

  const loadVoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await healthCheck();
      const { data } = await listVoices();
      const list =
        data.voices?.map((v) => ({
          id: v.id,
          label: v.label || v.name,
          previewUrl: v.previewUrl,
          previewReady: v.previewReady,
        })) || [];
      setVoices(list);
      if (data.previewCache) setCacheStatus(data.previewCache);
      if (data.device && data.device !== 'auto') setTtsDevice(data.device);
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

  useEffect(() => {
    if (cacheStatus?.complete) return;
    const id = window.setInterval(async () => {
      const done = await pollPreviewCache();
      if (done) window.clearInterval(id);
    }, 8000);
    return () => window.clearInterval(id);
  }, [cacheStatus?.complete, pollPreviewCache]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const stopPreview = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPreviewing(false);
  };

  const playUrl = async (url: string) => {
    stopPreview();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPreviewing(false);
    audio.onerror = () => {
      setPreviewError('Could not play preview audio');
      setPreviewing(false);
    };
    await audio.play();
  };

  const handlePreview = async () => {
    if (previewing) {
      stopPreview();
      return;
    }

    const selected = voices.find((v) => v.id === voiceSettings.voice);
    const defaultPitch = voiceSettings.pitch === 0;
    const defaultRate = voiceSettings.rate === 175;

    if (selected?.previewUrl && defaultPitch && defaultRate) {
      setPreviewing(true);
      setPreviewError(null);
      try {
        await playUrl(selected.previewUrl);
      } catch {
        setPreviewError('Could not play cached preview');
        setPreviewing(false);
      }
      return;
    }

    setPreviewing(true);
    setPreviewError(null);
    try {
      const { data } = await previewVoice({
        voice: voiceSettings.voice,
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
      });
      await playUrl(data.url);
    } catch (err) {
      setPreviewError(formatVoiceError(err));
      setPreviewing(false);
    }
  };

  const cacheHint =
    cacheStatus && !cacheStatus.complete
      ? `Preparing voice previews (${cacheStatus.ready}/${cacheStatus.total})…`
      : null;

  return (
    <section className="p-3 rounded-xl bg-black/30 border border-forge-border/40">
      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">
        <Mic className="w-3.5 h-3.5 text-forge-accent" />
        Voice & Narration
      </h3>

      {loading && (
        <p className="flex items-center gap-2 text-[10px] text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading voices…
        </p>
      )}

      {cacheHint && !loading && (
        <p className="flex items-center gap-2 text-[10px] text-amber-500/90 mb-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          {cacheHint}
        </p>
      )}

      {error && (
        <motion.div className="mb-2">
          <p className="text-[10px] text-red-400 mb-2">{error}</p>
          <button
            type="button"
            onClick={() => loadVoices()}
            className="text-[10px] text-forge-accent flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </motion.div>
      )}

      {!loading && !error && (
        <>
          <label className="block text-[10px] text-gray-500 mb-1">AI Voice</label>
          <select
            className="input-field text-xs mb-2.5 w-full"
            value={voiceSettings.voice || voices[0]?.id || ''}
            onChange={(e) => setVoiceSettings({ voice: e.target.value })}
            disabled={!voices.length}
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
                {v.previewReady ? '' : ' (preview pending)'}
              </option>
            ))}
          </select>

          <label className="block text-[10px] text-gray-500 mb-1">
            Speed ({voiceSettings.rate} WPM)
          </label>
          <input
            type="range"
            min={120}
            max={220}
            value={voiceSettings.rate}
            onChange={(e) => setVoiceSettings({ rate: Number(e.target.value) })}
            className="neon-slider mb-2.5"
          />

          <label className="block text-[10px] text-gray-500 mb-1">
            Pitch ({voiceSettings.pitch > 0 ? '+' : ''}
            {voiceSettings.pitch})
          </label>
          <input
            type="range"
            min={-12}
            max={12}
            value={voiceSettings.pitch}
            onChange={(e) => setVoiceSettings({ pitch: Number(e.target.value) })}
            className="neon-slider mb-2.5"
          />

          {previewError && (
            <p className="text-[10px] text-red-400 mb-2">{previewError}</p>
          )}

          <button
            type="button"
            onClick={handlePreview}
            disabled={!voices.length}
            className="w-full py-1.5 rounded-lg border border-forge-border/50 text-[10px] font-medium text-gray-400 hover:text-white hover:border-forge-accent/40 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
          >
            {previewing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {cacheHint ? 'Preparing…' : 'Playing…'}
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Preview Voice
              </>
            )}
          </button>

          <p className="text-[9px] text-gray-600 mt-2">
            Chatterbox-Turbo + Multilingual v3 · {ttsDevice ? `device: ${ttsDevice}` : 'GPU auto'}
            {cacheStatus?.complete ? ' · previews cached' : ''}
          </p>
        </>
      )}
    </section>
  );
}
