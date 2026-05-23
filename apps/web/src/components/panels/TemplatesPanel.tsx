import { Film, LayoutTemplate, MonitorPlay } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import { useDocumentaryPipeline } from '../../hooks/useDocumentaryPipeline';
import {
  DEFAULT_TEMPLATE_ID,
  DOCUMENTARY_VISUAL_TEMPLATES,
  WALKTHROUGH_FORMAT_TEMPLATES,
} from '../../constants/documentaryTemplates';
import type { VideoStyle } from '../../utils/api';

function TemplateSwatch({
  primary,
  secondary,
  background,
}: {
  primary: string;
  secondary: string;
  background: string;
}) {
  return (
    <div
      className="w-10 h-10 rounded-md shrink-0 border border-white/10 overflow-hidden flex flex-col"
      style={{ background }}
    >
      <div style={{ flex: 1, background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
    </div>
  );
}

export function TemplatesPanel() {
  const { input, setInput, script, media } = useProjectStore();
  const { rebuildTimelineFlow } = useDocumentaryPipeline();
  const activeId = input.templateId || DEFAULT_TEMPLATE_ID;
  const isWalkthrough = input.videoStyle === 'walkthrough';

  const applyVisualTemplate = async (id: string) => {
    setInput({
      videoStyle: 'documentary',
      templateId: id,
    });
    if (script && media.length > 0) {
      await rebuildTimelineFlow({ videoStyle: 'documentary', templateId: id });
    }
  };

  const applyWalkthrough = (id: string, videoStyle: VideoStyle) => {
    setInput({
      videoStyle,
      templateId: id,
    });
  };

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Film className="w-4 h-4 text-forge-accent" />
          Visual template
        </h3>
        <p className="text-[10px] text-gray-500 mb-3">
          Look & feel for documentary renders — intro, subtitles, transitions, color grade
        </p>
        <ul className="space-y-2">
          {DOCUMENTARY_VISUAL_TEMPLATES.map((t) => {
            const active = !isWalkthrough && activeId === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => applyVisualTemplate(t.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                    active
                      ? 'border-forge-accent/60 bg-forge-accent/10'
                      : 'border-forge-border/30 hover:border-forge-accent/50 hover:bg-forge-accent/5'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {t.preview && (
                      <TemplateSwatch
                        primary={t.preview.primary}
                        secondary={t.preview.secondary}
                        background={t.preview.background}
                      />
                    )}
                    <div>
                      <p className="text-xs font-medium text-gray-200">
                        {t.name}
                        {t.id === DEFAULT_TEMPLATE_ID && (
                          <span className="ml-1.5 text-[9px] uppercase text-forge-cyan/80">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{t.description}</p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <MonitorPlay className="w-4 h-4 text-forge-accent" />
          Format
        </h3>
        <p className="text-[10px] text-gray-500 mb-3">
          Walkthrough / screen-recording style compositions
        </p>
        <ul className="space-y-2">
          {WALKTHROUGH_FORMAT_TEMPLATES.map((t) => {
            const active = isWalkthrough && input.templateId === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => applyWalkthrough(t.id, t.videoStyle)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                    active
                      ? 'border-forge-accent/60 bg-forge-accent/10'
                      : 'border-forge-border/30 hover:border-forge-accent/50 hover:bg-forge-accent/5'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <LayoutTemplate className="w-4 h-4 text-forge-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-200">{t.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{t.description}</p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
