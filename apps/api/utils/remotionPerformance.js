/**
 * Remotion render tuning — concurrency, GPU encoding, Chromium GL backend.
 */
import os from 'os';

export function isMaxPerformanceMode() {
  return (
    process.env.REMOTION_MAX_PERFORMANCE === '1' ||
    process.env.REMOTION_PERFORMANCE === 'max'
  );
}

/** Parallel Chrome tabs rendering frames (leave headroom for OS + API). */
export function resolveRemotionConcurrency() {
  const raw = Number(process.env.REMOTION_CONCURRENCY);
  const cpus = os.cpus()?.length || 4;
  const ramGb = os.totalmem() / 1024 ** 3;

  if (Number.isFinite(raw) && raw > 0) {
    const cap = ramGb >= 24 ? 8 : ramGb >= 16 ? 6 : 4;
    return Math.min(cap, Math.max(1, Math.floor(raw)));
  }

  if (isMaxPerformanceMode()) {
    if (ramGb >= 28) return Math.min(8, Math.max(5, cpus - 4));
    if (ramGb >= 16) return Math.min(6, Math.max(4, cpus - 3));
    return Math.min(4, Math.max(2, Math.floor(cpus / 2)));
  }
  return Math.min(4, Math.max(2, Math.floor(cpus / 3)));
}

export function resolveChromiumOptions() {
  const glEnv = (process.env.REMOTION_GL || '').trim().toLowerCase();
  let gl = glEnv;
  if (!gl || gl === 'default') {
    gl = process.platform === 'win32' ? 'angle' : process.platform === 'linux' ? 'angle-egl' : null;
  }
  if (gl === 'null' || gl === 'none') gl = null;

  const opts = { disableWebSecurity: true };
  if (gl) opts.gl = gl;
  return opts;
}

export function resolveHardwareAcceleration() {
  const mode = (process.env.REMOTION_HARDWARE_ACCELERATION || '').trim().toLowerCase();
  if (mode === 'software' || mode === 'prefer-software') return 'prefer-software';
  if (mode === 'off' || mode === 'no-preference') return 'no-preference';
  if (
    isMaxPerformanceMode() ||
    mode === 'prefer-hardware' ||
    mode === 'hardware' ||
    mode === 'gpu'
  ) {
    return 'prefer-hardware';
  }
  return 'no-preference';
}

export function resolveOffthreadVideoCacheBytes() {
  const mb = Number(process.env.REMOTION_OFFTHREAD_VIDEO_CACHE_MB);
  if (Number.isFinite(mb) && mb > 0) return Math.floor(mb * 1024 * 1024);
  const ramGb = os.totalmem() / 1024 ** 3;
  if (isMaxPerformanceMode()) {
    return Math.floor((ramGb >= 24 ? 1024 : 512) * 1024 * 1024);
  }
  return undefined;
}

export function resolveOffthreadVideoThreads() {
  const raw = Number(process.env.REMOTION_OFFTHREAD_VIDEO_THREADS);
  if (Number.isFinite(raw) && raw > 0) return Math.min(8, Math.floor(raw));
  if (isMaxPerformanceMode()) {
    const cpus = os.cpus()?.length || 4;
    return Math.min(4, Math.max(2, Math.floor(cpus / 2)));
  }
  return undefined;
}

/** Kinetic (per-word) subtitles are costly — use line cues when true. */
export function preferLineSubtitles() {
  if (process.env.REMOTION_KINETIC_SUBTITLES === '1') return false;
  if (process.env.REMOTION_KINETIC_SUBTITLES === '0') return true;
  return isMaxPerformanceMode() || process.env.REMOTION_FAST_SUBTITLES === '1';
}

/** Required when hardwareAcceleration is enabled (cannot use CRF). */
export function resolveVideoBitrate() {
  const hw = resolveHardwareAcceleration();
  if (hw !== 'prefer-hardware') return undefined;
  return process.env.REMOTION_VIDEO_BITRATE || '12M';
}

export function resolveX264Preset() {
  if (resolveHardwareAcceleration() === 'prefer-hardware') return undefined;
  const preset = process.env.REMOTION_X264_PRESET;
  if (preset) return preset;
  if (isMaxPerformanceMode()) return 'veryfast';
  return undefined;
}

export function resolveJpegQuality(fastRender) {
  const fromEnv = Number(process.env.REMOTION_JPEG_QUALITY);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  if (fastRender || isMaxPerformanceMode()) return 72;
  return 85;
}

export function shouldStripHeavyEffects(fastRender) {
  return Boolean(fastRender) || isMaxPerformanceMode();
}

/** Per Video delayRender() — must exceed slow FFmpeg extractions under load. */
export function resolveDelayRenderTimeoutMs() {
  const fromEnv = Number(process.env.REMOTION_DELAY_RENDER_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 30_000) return fromEnv;
  return 600_000;
}

export function resolveVideoDelayRenderRetries() {
  const n = Number(process.env.REMOTION_VIDEO_EXTRACT_RETRIES);
  return Number.isFinite(n) && n >= 0 ? Math.min(5, Math.floor(n)) : 2;
}

/** Too many parallel tabs + video extract = timeout; cap workers when clips are video. */
export function resolveConcurrencyForScenes(scenes, baseConcurrency) {
  const videoCount = (scenes || []).filter(
    (s) => s?.type === 'video' || s?.media?.type === 'video',
  ).length;
  if (videoCount === 0) return baseConcurrency;

  const capEnv = Number(process.env.REMOTION_VIDEO_CONCURRENCY_MAX);
  const cap = Number.isFinite(capEnv) && capEnv > 0 ? capEnv : videoCount >= 4 ? 3 : 4;

  if (baseConcurrency > cap) {
    console.warn(
      `[Remotion] ${videoCount} video clip(s) — lowering concurrency ${baseConcurrency} → ${cap} (avoids extract timeouts)`,
    );
    return cap;
  }
  return baseConcurrency;
}

export function logRemotionPerformancePlan({ concurrency, hardwareAcceleration, chromiumOptions }) {
  const cpus = os.cpus()?.length || '?';
  const ramGb = Math.round((os.totalmem() / 1024 ** 3) * 10) / 10;
  console.log(
    `[Remotion] Performance · CPUs=${cpus} RAM=${ramGb}GB · concurrency=${concurrency} · GL=${chromiumOptions.gl || 'auto'} · encode=${hardwareAcceleration}`,
  );
  if (isMaxPerformanceMode()) {
    console.log(
      '[Remotion] REMOTION_MAX_PERFORMANCE=1 — GPU encode + parallel frames (template look preserved)',
    );
  }
}
