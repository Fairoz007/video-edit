'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@docuforge/convex/_generated/api';
import Link from 'next/link';
import { ReactNode, useEffect } from 'react';

export function AuthGate({ children }: { children: ReactNode }) {
  const me = useQuery(api.userProfiles.me);
  const ensureProfile = useMutation(api.userProfiles.ensure);

  useEffect(() => {
    if (me?.userId && !me.profile) {
      ensureProfile().catch(() => {});
    }
  }, [me?.userId, me?.profile, ensureProfile]);

  if (me === undefined) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-[#9A8B78]">
        Loading…
      </div>
    );
  }

  if (me === null) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-[#9A8B78]">Sign in to manage your documentaries.</p>
        <Link
          href="/sign-in"
          className="rounded-lg bg-forge-accent/20 border border-forge-accent/50 px-4 py-2 text-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
