import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Loader2, RefreshCw, Play } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { formatBackendUnreachableMessage } from '../../utils/apiBase';
import { healthCheck, listVoices, previewVoice } from '../../utils/api';
import { useProjectStore } from '../../hooks/useProjectStore';
import { SettingsField, SettingsSection } from '../ui/SettingsSection';

function formatVoiceError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      return formatBackendUnreachableMessage();
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const selectedVoice = voices.find((v) => v.id === voiceSettings.voice);
  const canPreview = Boolean(
    selectedVoice?.previewUrl || selectedVoice?.id.startsWith('elevenlabs:'),
  );

  return (
    <SettingsSection title="Voice & narration" icon={Mic}>
      {loading && (
        <p className="flex items-center gap-2 text-xs text-forge-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading voices…
        </p>
      )}

      {error && (
        <motion.div className="mb-2">
          <p className="text-xs text-red-400 mb-2">{error}</p>
          <button
            type="button"
            onClick={() => loadVoices()}
            className="text-xs text-forge-glow flex items-center gap-1 hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </motion.div>
      )}

      {!loading && !error && (
        <>
          <SettingsField label="AI voice">
            <select
              className="input-field text-xs w-full"
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
          </SettingsField>

          <SettingsField label={`Speed · ${voiceSettings.rate} WPM`}>
            <input
              type="range"
              min={120}
              max={220}
              value={voiceSettings.rate}
              onChange={(e) => setVoiceSettings({ rate: Number(e.target.value) })}
              className="neon-slider"
            />
          </SettingsField>

          <SettingsField label={`Pitch · ${voiceSettings.pitch > 0 ? '+' : ''}${voiceSettings.pitch}`}>
            <input
              type="range"
              min={-12}
              max={12}
              value={voiceSettings.pitch}
              onChange={(e) => setVoiceSettings({ pitch: Number(e.target.value) })}
              className="neon-slider"
            />
          </SettingsField>

          {previewError && <p className="text-xs text-red-400">{previewError}</p>}

          {canPreview ? (
            <button
              type="button"
              onClick={handlePreview}
              disabled={!voices.length}
              className="w-full py-2.5 rounded-studio-lg border border-forge-border-strong text-xs font-semibold text-forge-text-secondary hover:text-forge-text hover:border-forge-border-accent hover:shadow-glow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {previewing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Playing…
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Preview voice
                </>
              )}
            </button>
          ) : (
            <p className="settings-hint">
              Voice preview uses ElevenLabs sample audio when available.
            </p>
          )}

          <p className="settings-hint">{ttsDevice ? `TTS: ${ttsDevice}` : 'ElevenLabs + Chatterbox'}</p>
        </>
      )}
    </SettingsSection>
  );
}
