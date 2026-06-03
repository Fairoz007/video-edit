import Link from 'next/link';
import { DEFAULT_TEMPLATE_ID } from '@docuforge/shared';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-forge-accent mb-2">DocuForge Cloud</p>
      <h1 className="text-4xl font-serif text-forge-cyan mb-4">Premium Longform Documentaries</h1>
      <p className="text-[#9A8B78] mb-8 leading-relaxed">
        SaaS migration in progress. Visual template locked to{' '}
        <code className="text-sm text-forge-cyan">{DEFAULT_TEMPLATE_ID}</code>.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-forge-accent/20 border border-forge-accent/50 px-4 py-2 text-sm hover:bg-forge-accent/30"
        >
          Dashboard
        </Link>
        <Link
          href="/sign-in"
          className="rounded-lg border border-forge-border px-4 py-2 text-sm hover:border-forge-accent/50"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
