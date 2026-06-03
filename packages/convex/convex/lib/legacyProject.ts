import { DEFAULT_TEMPLATE_ID } from './constants';

const STATUS_MAP: Record<string, 'draft' | 'generating' | 'rendering' | 'completed' | 'failed' | 'cancelled'> = {
  created: 'draft',
  draft: 'draft',
  generating: 'generating',
  rendering: 'rendering',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled',
  unknown: 'draft',
};

export function normalizeLegacyStatus(status: unknown): 'draft' | 'generating' | 'rendering' | 'completed' | 'failed' | 'cancelled' {
  if (typeof status !== 'string') return 'draft';
  return STATUS_MAP[status] ?? 'draft';
}

export function deriveProjectTitle(legacy: {
  input?: { topic?: string; scriptText?: string };
  id?: string;
}): string {
  const topic = legacy.input?.topic?.trim();
  if (topic) return topic.slice(0, 120);
  const script = legacy.input?.scriptText?.trim();
  if (script) {
    const firstLine = script.split('\n').find((l) => l.trim())?.trim();
    if (firstLine) return firstLine.slice(0, 120);
  }
  if (legacy.id) return `Imported ${legacy.id}`;
  return 'Untitled documentary';
}

export function legacyToConvexFields(legacy: Record<string, unknown>) {
  const input = (legacy.input as Record<string, unknown>) ?? {};
  const templateId =
    typeof input.templateId === 'string' ? input.templateId : DEFAULT_TEMPLATE_ID;
  const normalizedTemplate =
    templateId === 'template_premium_longform' ? templateId : DEFAULT_TEMPLATE_ID;

  const createdAt =
    typeof legacy.createdAt === 'string'
      ? Date.parse(legacy.createdAt) || Date.now()
      : typeof legacy.createdAt === 'number'
        ? legacy.createdAt
        : Date.now();

  return {
    title: deriveProjectTitle(legacy as { input?: { topic?: string; scriptText?: string }; id?: string }),
    status: normalizeLegacyStatus(legacy.status),
    input: { ...input, templateId: normalizedTemplate },
    templateId: normalizedTemplate,
    script: legacy.script,
    keywords: legacy.keywords,
    timeline: legacy.timeline,
    media: legacy.media,
    progress: typeof legacy.progress === 'number' ? legacy.progress : 0,
    stage: typeof legacy.stage === 'string' ? legacy.stage : '',
    message: typeof legacy.message === 'string' ? legacy.message : '',
    outputPath: typeof legacy.outputPath === 'string' ? legacy.outputPath : undefined,
    error: typeof legacy.error === 'string' ? legacy.error : undefined,
    voiceSettings: legacy.voiceSettings,
    exportOptions: legacy.exportOptions,
    legacyLocalId: typeof legacy.id === 'string' ? legacy.id : undefined,
    createdAt,
    updatedAt: Date.now(),
  };
}
