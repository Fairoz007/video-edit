import { mutation, query } from './_generated/server';
import { APP_USER_ID } from './lib/constants';
import { ensureUserProfile, getProfileByUserId } from './lib/userProfile';

export const me = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfileByUserId(ctx, APP_USER_ID);
    return {
      userId: APP_USER_ID,
      profile,
    };
  },
});

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    await ensureUserProfile(ctx, APP_USER_ID);
    return APP_USER_ID;
  },
});
