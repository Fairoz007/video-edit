import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUserId } from './lib/auth';

export const enqueue = mutation({
  args: {
    projectId: v.id('projects'),
    pipeline: v.optional(v.string()),
    options: v.optional(v.any()),
    exportPreset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error('Project not found');
    }

    const jobId = await ctx.db.insert('renderJobs', {
      projectId: args.projectId,
      userId,
      status: 'queued',
      pipeline: args.pipeline ?? 'full',
      options: args.options ?? {},
      progress: 0,
      stage: 'queued',
      message: 'Waiting for render worker',
      exportPreset: args.exportPreset ?? '1080p',
    });

    await ctx.db.patch(args.projectId, {
      status: 'rendering',
      progress: 0,
      stage: 'queued',
      message: 'Render queued',
      updatedAt: Date.now(),
    });

    return jobId;
  },
});

export const getByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return [];
    }
    return await ctx.db
      .query('renderJobs')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .order('desc')
      .collect();
  },
});

/** Called by render workers with WORKER_SECRET (Phase 6). */
export const claimNext = mutation({
  args: {
    workerId: v.string(),
    workerSecret: v.string(),
  },
  handler: async (ctx, { workerId, workerSecret }) => {
    if (workerSecret !== process.env.WORKER_SECRET) {
      throw new Error('Unauthorized worker');
    }
    const queued = await ctx.db
      .query('renderJobs')
      .withIndex('by_status', (q) => q.eq('status', 'queued'))
      .first();
    if (!queued) return null;

    await ctx.db.patch(queued._id, {
      status: 'claimed',
      workerId,
      claimedAt: Date.now(),
      stage: 'claimed',
      message: `Worker ${workerId}`,
    });
    return queued;
  },
});
