import Link from 'next/link';
import { DEFAULT_TEMPLATE_ID } from '@docuforge/shared';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-forge-accent mb-2">DocuForge Cloud</p>
      <h1 className="text-4xl font-serif text-forge-cyan mb-4">Premium Longform Documentaries</h1>
      <p className="text-[#9A8B78] mb-8 leading-relaxed">
        Visual template locked to{' '}
        <code className="text-sm text-forge-cyan">{DEFAULT_TEMPLATE_ID}</code>.
      </p>
      <Link
        href="/dashboard"
        className="inline-block rounded-lg bg-forge-accent/20 border border-forge-accent/50 px-4 py-2 text-sm hover:bg-forge-accent/30"
      >
        Open dashboard
      </Link>
    </main>
  );
}
