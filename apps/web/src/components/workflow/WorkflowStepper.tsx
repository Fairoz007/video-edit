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
  { id: 1 as WorkflowStepId, label: 'Input', icon: PenLine },
  { id: 2 as WorkflowStepId, label: 'Script', icon: FileText },
  { id: 3 as WorkflowStepId, label: 'Media', icon: Image },
  { id: 4 as WorkflowStepId, label: 'Narration', icon: Mic },
  { id: 5 as WorkflowStepId, label: 'Timeline', icon: Layers },
  { id: 6 as WorkflowStepId, label: 'Render', icon: Clapperboard },
];

type StepStatus = 'idle' | 'active' | 'done' | 'processing';

function getStepStatuses(
  scriptSections: number,
  mediaCount: number,
  narrationReady: boolean,
  sceneCount: number,
  renderStatus: string,
  videoOnly: boolean,
): Record<WorkflowStepId, StepStatus> {
  const hasScript = scriptSections > 0;
  const hasMedia = mediaCount > 0;
  const hasTimeline = sceneCount > 0;

  return {
    1: hasScript || hasMedia ? 'done' : 'active',
    2: renderStatus === 'generating' && !hasScript ? 'processing' : hasScript ? 'done' : hasMedia ? 'active' : 'idle',
    3: hasMedia ? 'done' : hasScript ? 'active' : 'idle',
    4: videoOnly ? 'done' : narrationReady ? 'done' : hasScript ? 'active' : 'idle',
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

function stepIconClass(status: StepStatus, selected: boolean): string {
  if (status === 'done') return 'workflow-step-done';
  if (status === 'processing') return 'workflow-step-active';
  if (selected || status === 'active') return 'workflow-step-active ring-2 ring-forge-glow/30';
  return 'workflow-step-idle';
}

export function WorkflowStepper() {
  const { script, media, timeline, status, input } = useProjectStore();
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
    videoOnly,
  );

  const visibleSteps = videoOnly ? STEPS.filter((s) => s.id !== 4) : STEPS;

  const onSelect = (id: WorkflowStepId) => {
    setActiveWorkflowStep(id);
    if (id === 1) setSourcePanelOpen(true);
  };

  const doneCount = visibleSteps.filter((s) => statuses[s.id] === 'done').length;
  const progressPct = (doneCount / visibleSteps.length) * 100;

  return (
    <nav className="glass-panel-elevated px-3 py-3 shrink-0" aria-label="Production workflow">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <span className="section-label">Production pipeline</span>
        <span className="text-[11px] font-mono text-forge-muted tabular-nums">
          {doneCount}/{visibleSteps.length} complete
        </span>
      </div>

      <div className="h-1 rounded-full bg-black/40 overflow-hidden mb-3 border border-forge-border/40">
        <motion.div
          className="h-full accent-gradient"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="flex items-center gap-0 overflow-x-auto pb-0.5">
        {visibleSteps.map((step, index) => {
          const stepStatus = statuses[step.id];
          const isSelected = activeWorkflowStep === step.id;
          const Icon = step.icon;
          const prevDone = index > 0 && statuses[visibleSteps[index - 1].id] === 'done';

          return (
            <div key={step.id} className="flex items-center shrink-0">
              {index > 0 && (
                <div className={prevDone ? 'workflow-connector-done' : 'workflow-connector-idle'} />
              )}
              <motion.button
                type="button"
                onClick={() => onSelect(step.id)}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-studio-lg transition-all duration-200 min-w-[100px] ${
                  isSelected
                    ? 'bg-white/[0.06] border border-forge-border-accent shadow-glow-sm'
                    : 'border border-transparent hover:bg-white/[0.04]'
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-shadow ${stepIconClass(stepStatus, isSelected)}`}
                >
                  {stepStatus === 'processing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : stepStatus === 'done' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </span>
                <span className="text-left hidden sm:block">
                  <span className="block text-[10px] font-mono text-forge-muted leading-none mb-0.5">
                    {String(step.id).padStart(2, '0')}
                  </span>
                  <span className="block text-xs font-semibold text-forge-text leading-tight">
                    {step.label}
                  </span>
                </span>
              </motion.button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
