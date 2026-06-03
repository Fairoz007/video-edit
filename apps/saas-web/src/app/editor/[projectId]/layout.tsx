import { AuthGate } from '@/components/AuthGate';

export default function EditorRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="h-[100dvh] overflow-hidden">{children}</div>
    </AuthGate>
  );
}
