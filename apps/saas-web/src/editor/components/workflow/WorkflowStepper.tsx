import { motion } from 'framer-motion';
import {
  PenLine,
  FileText,
  Image,
  Mic,
  Layers,
  Clapperboard,
  Check,
  Loader2,
} from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useUiStore, type WorkflowStepId } from '../../hooks/useUiStore';
import { isVideoOnlyEditMode } from '../../utils/timelineSync';

const STEPS = [
  { id: 1 as WorkflowStepId, label: 'Input', short: 'Input', icon: PenLine },
  { id: 2 as WorkflowStepId, label: 'Script', short: 'Script', icon: FileText },
  { id: 3 as WorkflowStepId, label: 'Media', short: 'Media', icon: Image },
  { id: 4 as WorkflowStepId, label: 'Narration', short: 'Voice', icon: Mic },
  { id: 5 as WorkflowStepId, label: 'Timeline', short: 'Edit', icon: Layers },
  { id: 6 as WorkflowStepId, label: 'Render', short: 'Export', icon: Clapperboard },
];

type StepStatus = 'idle' | 'active' | 'done' | 'processing';

function getStepStatuses(
  scriptSections: number,
  mediaCount: number,
  narrationReady: boolean,
  sceneCount: number,
  renderStatus: string,
  _progress: number,
  videoOnly: boolean,
): Record<WorkflowStepId, StepStatus> {
  const hasScript = scriptSections > 0;
  const hasMedia = mediaCount > 0;
  const hasTimeline = sceneCount > 0;

  return {
    1: hasScript || hasMedia ? 'done' : 'active',
    2: renderStatus === 'generating' && !hasScript ? 'processing' : hasScript ? 'done' : hasMedia ? 'active' : 'idle',
    3: hasMedia ? 'done' : hasScript ? 'active' : 'idle',
    4: videoOnly
      ? 'done'
      : narrationReady
        ? 'done'
        : hasScript
          ? 'active'
          : 'idle',
    5: hasTimeline ? 'done' : hasScript ? 'active' : 'idle',
    6:
      renderStatus === 'completed'
        ? 'done'
        : renderStatus === 'rendering'
          ? 'processing'
          : hasTimeline || hasScript
            ? 'active'
            : 'idle',
  };
}

export function WorkflowStepper() {
  const { script, media, timeline, status, progress, input } = useProjectStore();
  const { activeWorkflowStep, setActiveWorkflowStep, setSourcePanelOpen } = useUiStore();
  const videoOnly = isVideoOnlyEditMode(input.editMode);

  const sectionCount = script?.sections.length ?? 0;
  const mediaCount = media.length;
  const narrationReady =
    (script?.sections.reduce((a, s) => a + (s.durationEstimate ?? 0), 0) ?? 0) > 0;
  const sceneCount = timeline?.scenes.length ?? 0;

  const statuses = getStepStatuses(
    sectionCount,
    mediaCount,
    narrationReady,
    sceneCount,
    status,
    progress,
    videoOnly,
  );

  const visibleSteps = videoOnly ? STEPS.filter((s) => s.id !== 4) : STEPS;

  const onSelect = (id: WorkflowStepId) => {
    setActiveWorkflowStep(id);
    if (id === 1) setSourcePanelOpen(true);
  };

  return (
    <nav
      className="flex items-stretch gap-0.5 px-1 py-1 rounded-studio-lg bg-forge-surface/80 border border-forge-border overflow-x-auto shrink-0"
      aria-label="Production workflow"
    >
      {visibleSteps.map((step, index) => {
        const stepStatus = statuses[step.id];
        const isSelected = activeWorkflowStep === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center shrink-0">
            {index > 0 && (
              <motion.div
                className={`w-6 h-px mx-0.5 shrink-0 ${
                  statuses[visibleSteps[index - 1].id] === 'done' ? 'bg-forge-accent/50' : 'bg-forge-border'
                }`}
              />
            )}
            <motion.button
              type="button"
              onClick={() => onSelect(step.id)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-studio transition-all duration-200 min-w-[88px] ${
                isSelected
                  ? 'bg-white/[0.08] text-forge-text border border-forge-border-strong'
                  : 'text-forge-text-secondary hover:text-forge-text hover:bg-white/[0.04] border border-transparent'
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                  stepStatus === 'done'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : stepStatus === 'processing'
                      ? 'accent-gradient text-white'
                      : isSelected
                        ? 'bg-forge-accent/20 text-forge-glow'
                        : 'bg-white/[0.04] text-forge-muted'
                }`}
              >
                {stepStatus === 'processing' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : stepStatus === 'done' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </span>
              <span className="text-left hidden sm:block">
                <span className="block text-[10px] font-mono text-forge-muted leading-none mb-0.5">
                  {String(step.id).padStart(2, '0')}
                </span>
                <span className="block text-xs font-semibold leading-tight">{step.label}</span>
              </span>
              <span className="sm:hidden text-xs font-semibold">{step.short}</span>
            </motion.button>
          </div>
        );
      })}
    </nav>
  );
}
