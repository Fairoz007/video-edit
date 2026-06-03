import { convexAuth } from '@convex-dev/auth/server';
import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';
import { ensureUserProfile } from './lib/userProfile';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub, Google],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      if (!userId) return;
      await ensureUserProfile(ctx, userId);
    },
  },
});
