import { LayoutTemplate, Sparkles, MonitorPlay } from 'lucide-react';
import { useProjectStore } from '../../hooks/useProjectStore';
import type { VideoStyle } from '../../utils/api';

const TEMPLATES: {
  id: string;
  name: string;
  sections: number;
  videoStyle: VideoStyle;
  description: string;
  icon: typeof LayoutTemplate;
}[] = [
  {
    id: 'history',
    name: 'Historical Documentary',
    sections: 5,
    videoStyle: 'documentary',
    description: 'Ken Burns scenes, lower thirds, animated captions',
    icon: LayoutTemplate,
  },
  {
    id: 'corporate',
    name: 'Corporate Profile',
    sections: 4,
    videoStyle: 'documentary',
    description: 'Professional fades and section titles',
    icon: LayoutTemplate,
  },
  {
    id: 'travel',
    name: 'Travel & Culture',
    sections: 5,
    videoStyle: 'documentary',
    description: 'Cinematic transitions and motion accents',
    icon: Sparkles,
  },
  {
    id: 'walkthrough',
    name: 'App / UI Walkthrough',
    sections: 0,
    videoStyle: 'walkthrough',
    description: 'Stitch-style slides, zoom, progress bar, voiceover',
    icon: MonitorPlay,
  },
  {
    id: 'product',
    name: 'Product Demo',
    sections: 0,
    videoStyle: 'walkthrough',
    description: 'Screen-by-screen with slide & wipe transitions',
    icon: MonitorPlay,
  },
];

export function TemplatesPanel() {
  const { input, setInput } = useProjectStore();

  const applyTemplate = (template: (typeof TEMPLATES)[0]) => {
    setInput({
      videoStyle: template.videoStyle,
      templateId: template.id,
    });
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-1">Video style</h3>
      <p className="text-[10px] text-gray-500 mb-3">
        Remotion compositions: Documentary or Walkthrough
      </p>
      <ul className="space-y-2">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          const active = input.templateId === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => applyTemplate(t)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                  active
                    ? 'border-forge-accent/60 bg-forge-accent/10'
                    : 'border-forge-border/30 hover:border-forge-accent/50 hover:bg-forge-accent/5'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 text-forge-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-200">{t.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t.description}</p>
                    {t.sections > 0 && (
                      <p className="text-[10px] text-gray-600 mt-1">{t.sections} sections</p>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
