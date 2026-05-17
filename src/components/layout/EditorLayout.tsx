import { LeftSidebar } from '../sidebar/LeftSidebar';
import { RightSidebar } from '../sidebar/RightSidebar';
import { CenterWorkspace } from './CenterWorkspace';

export function EditorLayout() {
  return (
    <div className="flex h-full">
      <LeftSidebar />
      <CenterWorkspace />
      <RightSidebar />
    </div>
  );
}
