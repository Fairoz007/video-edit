import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUserId } from './lib/auth';
import { DEFAULT_TEMPLATE_ID } from './lib/constants';
import { ensureUserProfile } from './lib/userProfile';
import { legacyToConvexFields } from './lib/legacyProject';

const projectStatus = v.union(
  v.literal('draft'),
  v.literal('generating'),
  v.literal('rendering'),
  v.literal('completed'),
  v.literal('failed'),
  v.literal('cancelled'),
);

function defaultInput() {
  return { videoStyle: 'documentary', templateId: DEFAULT_TEMPLATE_ID, editMode: 'with-narration' };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const get = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return null;
    }
    return project;
  },
});

/** Shape aligned with legacy GET /api/render/status/:id for editor migration. */
export const getDocument = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return null;
    }
    const assets = await ctx.db
      .query('assets')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();

    const outputAsset = project.outputAssetId
      ? assets.find((a) => a._id === project.outputAssetId)
      : assets.find((a) => a.kind === 'export');

    const outputUrl = outputAsset?.cdnUrl ?? project.outputPath;

    return {
      id: project.legacyLocalId ?? projectId,
      convexId: projectId,
      title: project.title,
      status: project.status,
      input: project.input,
      script: project.script,
      keywords: project.keywords,
      media: project.media ?? [],
      assets,
      timeline: project.timeline,
      progress: project.progress,
      stage: project.stage,
      message: project.message,
      outputPath: outputUrl,
      outputAssetId: outputAsset?._id ?? project.outputAssetId,
      error: project.error,
      voiceSettings: project.voiceSettings,
      exportOptions: project.exportOptions,
      templateId: project.templateId,
      createdAt: new Date(project.createdAt).toISOString(),
      updatedAt: project.updatedAt,
    };
  },
});

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await ensureUserProfile(ctx, userId);
    const now = Date.now();
    const input = { ...defaultInput(), ...(args.input ?? {}) };
    input.templateId = DEFAULT_TEMPLATE_ID;

    return await ctx.db.insert('projects', {
      userId,
      title: args.title?.trim() || 'Untitled documentary',
      status: 'draft',
      input,
      templateId: DEFAULT_TEMPLATE_ID,
      progress: 0,
      stage: '',
      message: '',
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    projectId: v.id('projects'),
    patch: v.object({
      title: v.optional(v.string()),
      status: v.optional(projectStatus),
      input: v.optional(v.any()),
      script: v.optional(v.any()),
      keywords: v.optional(v.any()),
      timeline: v.optional(v.any()),
      media: v.optional(v.any()),
      progress: v.optional(v.number()),
      stage: v.optional(v.string()),
      message: v.optional(v.string()),
      error: v.optional(v.string()),
      outputPath: v.optional(v.string()),
      voiceSettings: v.optional(v.any()),
      exportOptions: v.optional(v.any()),
      outputAssetId: v.optional(v.id('assets')),
      legacyLocalId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { projectId, patch }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error('Project not found');
    }
    await ctx.db.patch(projectId, {
      ...patch,
      updatedAt: Date.now(),
    });
    return projectId;
  },
});

export const remove = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      throw new Error('Project not found');
    }
    const jobs = await ctx.db
      .query('renderJobs')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();
    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }
    await ctx.db.delete(projectId);
    return { ok: true };
  },
});

/** Import a legacy `projects/<id>/project.json` document into Convex. */
export const importFromLegacy = mutation({
  args: {
    legacy: v.any(),
    /** If true, update existing project with same legacyLocalId instead of inserting. */
    upsert: v.optional(v.boolean()),
  },
  handler: async (ctx, { legacy, upsert }) => {
    const userId = await requireUserId(ctx);
    if (!legacy || typeof legacy !== 'object') {
      throw new Error('Invalid legacy project payload');
    }

    const fields = legacyToConvexFields(legacy as Record<string, unknown>);
    const legacyId = fields.legacyLocalId;

    if (legacyId && upsert) {
      const existing = await ctx.db
        .query('projects')
        .withIndex('by_user_legacy', (q) =>
          q.eq('userId', userId).eq('legacyLocalId', legacyId),
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { ...fields, userId });
        return { projectId: existing._id, updated: true };
      }
    }

    const projectId = await ctx.db.insert('projects', {
      userId,
      ...fields,
    });
    return { projectId, updated: false };
  },
});

/** Import many legacy projects (dashboard bundle upload). */
export const importFromLegacyBatch = mutation({
  args: {
    projects: v.array(v.any()),
    upsert: v.optional(v.boolean()),
  },
  handler: async (ctx, { projects, upsert }) => {
    const userId = await requireUserId(ctx);
    const results: { projectId: string; legacyLocalId?: string; updated: boolean }[] = [];

    for (const legacy of projects) {
      if (!legacy || typeof legacy !== 'object') continue;
      const fields = legacyToConvexFields(legacy as Record<string, unknown>);
      const legacyId = fields.legacyLocalId;

      if (legacyId && upsert) {
        const existing = await ctx.db
          .query('projects')
          .withIndex('by_user_legacy', (q) =>
            q.eq('userId', userId).eq('legacyLocalId', legacyId),
          )
          .unique();
        if (existing) {
          await ctx.db.patch(existing._id, { ...fields, userId });
          results.push({ projectId: existing._id, legacyLocalId: legacyId, updated: true });
          continue;
        }
      }

      const projectId = await ctx.db.insert('projects', { userId, ...fields });
      results.push({ projectId, legacyLocalId: legacyId, updated: false });
    }

    return { imported: results.length, results };
  },
});
