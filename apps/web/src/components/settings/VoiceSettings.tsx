import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Loader2, RefreshCw, Play, Square } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { healthCheck, listVoices, previewVoice } from '../../utils/api';
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
  const [voices, setVoices] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [ttsDevice, setTtsDevice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadVoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await healthCheck();
      const { data } = await listVoices();
      const list = data.voices?.map((v) => ({ id: v.id, label: v.label || v.name })) || [];
      setVoices(list);
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
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPreviewing(false);
  };

  const handlePreview = async () => {
    if (previewing) {
      stopPreview();
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

      stopPreview();
      const audio = new Audio(data.url);
      audioRef.current = audio;
      audio.onended = () => setPreviewing(false);
      audio.onerror = () => {
        setPreviewError('Could not play preview audio');
        setPreviewing(false);
      };
      await audio.play();
    } catch (err) {
      setPreviewError(formatVoiceError(err));
      setPreviewing(false);
    }
  };

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

          <motion.div
            className="h-8 rounded-lg bg-black/50 border border-forge-border/30 flex items-end gap-px px-1 mb-2"
            animate={previewing ? { opacity: [0.65, 1, 0.65] } : { opacity: 1 }}
            transition={{ repeat: previewing ? Infinity : 0, duration: 0.9 }}
          >
            {Array.from({ length: 32 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 bg-gradient-to-t from-emerald-600/80 to-cyan-500/60 rounded-sm"
                animate={
                  previewing
                    ? { scaleY: [0.35, 1, 0.5, 0.9, 0.4] }
                    : { scaleY: 0.45 + Math.sin(i * 0.4) * 0.35 }
                }
                style={{ transformOrigin: 'bottom' }}
                transition={
                  previewing
                    ? { repeat: Infinity, duration: 0.55 + (i % 5) * 0.05, delay: i * 0.02 }
                    : { duration: 0 }
                }
              />
            ))}
          </motion.div>

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
                Generating…
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
            {' · '}
            tags: [laugh] [chuckle]
          </p>
        </>
      )}
    </section>
  );
}
