'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '@docuforge/convex/_generated/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const me = useQuery(api.userProfiles.me);
  const router = useRouter();

  useEffect(() => {
    if (me?.userId) router.replace('/dashboard');
  }, [me?.userId, router]);

  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-serif text-forge-cyan mb-6">Sign in to DocuForge</h1>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="rounded-lg bg-forge-accent/20 border border-forge-accent/50 py-2 text-sm"
          onClick={() => signIn('google')}
        >
          Continue with Google
        </button>
        <button
          type="button"
          className="rounded-lg border border-forge-border py-2 text-sm"
          onClick={() => signIn('github')}
        >
          Continue with GitHub
        </button>
      </div>
      <Link href="/" className="mt-8 inline-block text-xs text-[#9A8B78] hover:text-forge-cyan">
        ← Back
      </Link>
    </main>
  );
}
