'use client';

import type { Id } from '@docuforge/convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import { DocumentaryEditor } from '@/editor/DocumentaryEditor';

export default function EditorPage() {
  const params = useParams();
  const projectId = params.projectId as Id<'projects'>;

  return <DocumentaryEditor projectId={projectId} />;
}
