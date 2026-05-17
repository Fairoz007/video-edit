import { DocumentarySettings } from '../settings/DocumentarySettings';
import { VoiceSettings } from '../settings/VoiceSettings';
import { MusicControls } from '../settings/MusicControls';
import { ExportSettings } from '../settings/ExportSettings';

export function RightSidebar() {
  return (
    <aside className="w-72 border-l border-forge-border bg-black/30 overflow-y-auto p-3 space-y-3">
      <DocumentarySettings />
      <VoiceSettings />
      <MusicControls />
      <ExportSettings />
    </aside>
  );
}
