import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ensureUserProfile } from './lib/userProfile';

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();

    return {
      userId,
      email: user?.email ?? null,
      name: user?.name ?? null,
      image: user?.image ?? null,
      profile,
    };
  },
});

/** Idempotent — creates free-tier profile if missing (e.g. pre-callback sign-ins). */
export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    await ensureUserProfile(ctx, userId);
    return userId;
  },
});
