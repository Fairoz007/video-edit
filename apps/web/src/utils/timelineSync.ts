import type { ScriptSection, TimelineScene } from './api';

export interface TimelineTrackItem {
  id: string;
  start: number;
  duration: number;
  label: string;
  color: string;
  waveform?: boolean;
}

/** Narration blocks aligned to video scene timestamps (or cumulative section durations). */
export function buildNarrationTrackItems(
  sections: ScriptSection[],
  scenes: TimelineScene[],
  totalDuration: number,
  introOffsetSec = 5,
): TimelineTrackItem[] {
  if (!sections.length) return [];

  const bySection = new Map<string, { start: number; duration: number }>();
  for (const scene of scenes) {
    if (!scene.sectionId) continue;
    const existing = bySection.get(scene.sectionId);
    if (!existing) {
      bySection.set(scene.sectionId, {
        start: scene.start,
        duration: scene.duration,
      });
    } else {
      existing.duration += scene.duration;
    }
  }

  if (bySection.size > 0) {
    return sections
      .map((sec) => {
        const timing = bySection.get(sec.id);
        if (!timing || timing.duration <= 0) return null;
        return {
          id: sec.id,
          start: timing.start,
          duration: timing.duration,
          label: sec.title,
          color: 'from-emerald-600 to-teal-600',
          waveform: true,
        };
      })
      .filter((item): item is TimelineTrackItem => item !== null);
  }

  const contentDuration = Math.max(1, totalDuration - introOffsetSec);
  const sectionTotal = sections.reduce((a, s) => a + (s.durationEstimate || 0), 0);
  const scale = sectionTotal > 0 ? contentDuration / sectionTotal : 1;

  let cursor = introOffsetSec;
  return sections.map((sec) => {
    const duration = Math.max(0.5, (sec.durationEstimate || 0) * scale);
    const item: TimelineTrackItem = {
      id: sec.id,
      start: cursor,
      duration,
      label: sec.title,
      color: 'from-emerald-600 to-teal-600',
      waveform: true,
    };
    cursor += duration;
    return item;
  });
}

export function isVideoOnlyEditMode(editMode?: string): boolean {
  return editMode === 'video-only';
}
