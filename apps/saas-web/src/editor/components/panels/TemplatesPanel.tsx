import { Film } from 'lucide-react';
import {
  DEFAULT_TEMPLATE_ID,
  DOCUMENTARY_VISUAL_TEMPLATES,
} from '../../constants/documentaryTemplates';

const TEMPLATE = DOCUMENTARY_VISUAL_TEMPLATES[0];

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

/** Single locked visual template — Premium Longform. */
export function TemplatesPanel() {
  const preview = TEMPLATE.preview;

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Film className="w-4 h-4 text-forge-accent" />
          Visual template
        </h3>
        <p className="text-[10px] text-gray-500 mb-3">
          Premium longform documentary — intro, subtitles, transitions, color grade
        </p>
        <div className="p-2.5 rounded-lg border border-forge-accent/40 bg-forge-accent/10">
          <div className="flex items-start gap-2.5">
            {preview && (
              <TemplateSwatch
                primary={preview.primary}
                secondary={preview.secondary}
                background={preview.background}
              />
            )}
            <div>
              <p className="text-xs font-medium text-gray-200">{TEMPLATE.name}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{TEMPLATE.description}</p>
              <p className="text-[9px] text-forge-cyan/70 mt-1 font-mono">{DEFAULT_TEMPLATE_ID}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
