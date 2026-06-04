import type { MutationCtx, QueryCtx } from '../_generated/server';
import { DEFAULT_USAGE } from './constants';

export async function getProfileByUserId(ctx: QueryCtx | MutationCtx, userId: string) {
  return await ctx.db
    .query('userProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
}

export async function ensureUserProfile(ctx: MutationCtx, userId: string) {
  const existing = await getProfileByUserId(ctx, userId);
  if (existing) return existing._id;

  return await ctx.db.insert('userProfiles', {
    userId,
    plan: 'free',
    usage: { ...DEFAULT_USAGE },
    youtubeConnected: false,
  });
}
