import { getAuthUserId } from '@convex-dev/auth/server';
import type { MutationCtx, QueryCtx } from '../_generated/server';

export async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error('Not authenticated');
  }
  return userId;
}
