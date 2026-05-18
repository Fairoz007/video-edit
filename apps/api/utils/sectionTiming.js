/**
 * Keep script section durations aligned with narration audio and timeline scenes.
 */

export function syncSectionDurationsFromAudio(sections, audioDurationSec) {
  if (!sections?.length || !audioDurationSec || audioDurationSec <= 0) {
    return sections;
  }

  const wordCounts = sections.map((s) =>
    (s.narration || '').split(/\s+/).filter(Boolean).length,
  );
  const totalWords = wordCounts.reduce((a, b) => a + b, 0) || 1;

  return sections.map((section, i) => ({
    ...section,
    durationEstimate: Math.max(1, (audioDurationSec * wordCounts[i]) / totalWords),
  }));
}

/** Per-section start/duration from timeline scenes (video track). */
export function sectionTimingFromScenes(sections, scenes) {
  if (!sections?.length) return [];

  const bySection = new Map();
  for (const scene of scenes || []) {
    if (!scene.sectionId) continue;
    const existing = bySection.get(scene.sectionId);
    if (!existing) {
      bySection.set(scene.sectionId, {
        start: scene.start ?? 0,
        duration: scene.duration ?? 0,
      });
    } else {
      existing.duration += scene.duration ?? 0;
    }
  }

  return sections.map((section) => {
    const fromScene = bySection.get(section.id);
    return {
      sectionId: section.id,
      start: fromScene?.start ?? 0,
      duration: fromScene?.duration ?? section.durationEstimate ?? 0,
    };
  });
}

/** Cap longest sections so one chapter cannot dominate the timeline. */
export function balanceSectionDurations(sections, maxRatio = 1.35) {
  if (!sections?.length) return sections;

  const durations = sections.map((s) => s.durationEstimate || 1);
  const min = Math.min(...durations);
  const cap = min * maxRatio;
  const capped = durations.map((d) => Math.min(d, cap));
  const cappedTotal = capped.reduce((a, b) => a + b, 0);
  const originalTotal = durations.reduce((a, b) => a + b, 0) || 1;
  const scale = originalTotal / cappedTotal;

  return sections.map((section, i) => ({
    ...section,
    durationEstimate: Math.max(1, capped[i] * scale),
  }));
}

export function syncSectionsToVideoTimeline(sections, scenes, contentDurationSec) {
  if (!sections?.length) return sections;

  const timings = sectionTimingFromScenes(sections, scenes);
  const sceneTotal = timings.reduce((a, t) => a + t.duration, 0);

  if (sceneTotal > 0) {
    return sections.map((section) => {
      const t = timings.find((x) => x.sectionId === section.id);
      return {
        ...section,
        durationEstimate: Math.max(1, t?.duration ?? section.durationEstimate ?? 0),
      };
    });
  }

  if (contentDurationSec && contentDurationSec > 0) {
    const perSection = contentDurationSec / sections.length;
    return sections.map((section) => ({
      ...section,
      durationEstimate: Math.max(1, perSection),
    }));
  }

  return sections;
}
