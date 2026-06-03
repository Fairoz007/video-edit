import { v } from 'convex/values';
import { internalQuery } from '../_generated/server';

export const getIfOwned = internalQuery({
  args: {
    projectId: v.id('projects'),
    userId: v.id('users'),
  },
  handler: async (ctx, { projectId, userId }) => {
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});
