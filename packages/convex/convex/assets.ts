import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUserId } from './lib/auth';
import { assetKindValidator } from './lib/assetKinds';
import { assertKeyOwnedByUser, buildCdnUrl } from './lib/r2Keys';
import { getR2Config } from './lib/r2Config';
import type { MutationCtx } from './_generated/server';
import { getProfileByUserId } from './lib/userProfile';

async function bumpStorageBytes(ctx: MutationCtx, userId: Awaited<ReturnType<typeof requireUserId>>, delta: number) {
  const profile = await getProfileByUserId(ctx, userId);
  if (!profile) return;
  await ctx.db.patch(profile._id, {
    usage: {
      ...profile.usage,
      storageBytes: Math.max(0, profile.usage.storageBytes + delta),
    },
  });
}

export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) return [];

    return await ctx.db
      .query('assets')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect();
  },
});

export const get = query({
  args: { assetId: v.id('assets') },
  handler: async (ctx, { assetId }) => {
    const userId = await requireUserId(ctx);
    const asset = await ctx.db.get(assetId);
    if (!asset || asset.userId !== userId) return null;
    return asset;
  },
});

/** Register asset in DB after client PUT to R2 succeeded. */
export const completeUpload = mutation({
  args: {
    projectId: v.id('projects'),
    kind: assetKindValidator,
    r2Key: v.string(),
    mime: v.string(),
    sizeBytes: v.optional(v.number()),
    durationSec: v.optional(v.number()),
    meta: v.optional(v.any()),
    /** Append to project.media array (editor manifest). */
    appendToProjectMedia: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) {
      throw new Error('Project not found');
    }

    assertKeyOwnedByUser(args.r2Key, userId, args.projectId);

    const existing = await ctx.db
      .query('assets')
      .withIndex('by_r2_key', (q) => q.eq('r2Key', args.r2Key))
      .first();

    if (existing) {
      return { assetId: existing._id, duplicate: true };
    }

    let cdnUrl: string;
    try {
      const { publicBase } = getR2Config();
      cdnUrl = buildCdnUrl(args.r2Key, publicBase);
    } catch {
      cdnUrl = args.r2Key;
    }

    const assetId = await ctx.db.insert('assets', {
      projectId: args.projectId,
      userId,
      kind: args.kind,
      r2Key: args.r2Key,
      cdnUrl,
      mime: args.mime,
      sizeBytes: args.sizeBytes,
      durationSec: args.durationSec,
      meta: args.meta,
    });

    if (args.sizeBytes) {
      await bumpStorageBytes(ctx, userId, args.sizeBytes);
    }

    if (args.appendToProjectMedia !== false) {
      const mediaEntry = {
        assetId,
        url: cdnUrl,
        r2Key: args.r2Key,
        type: args.mime.startsWith('video/') ? 'video' : args.mime.startsWith('audio/') ? 'audio' : 'file',
        kind: args.kind,
        source: 'r2',
        ...(args.meta && typeof args.meta === 'object' ? args.meta : {}),
      };
      const media = Array.isArray(project.media) ? [...project.media] : [];
      media.push(mediaEntry);
      await ctx.db.patch(args.projectId, {
        media,
        updatedAt: Date.now(),
      });
    }

    if (args.kind === 'export') {
      await ctx.db.patch(args.projectId, {
        outputAssetId: assetId,
        outputPath: cdnUrl,
        updatedAt: Date.now(),
      });
    }

    return { assetId, duplicate: false };
  },
});

export const remove = mutation({
  args: { assetId: v.id('assets') },
  handler: async (ctx, { assetId }) => {
    const userId = await requireUserId(ctx);
    const asset = await ctx.db.get(assetId);
    if (!asset || asset.userId !== userId) {
      throw new Error('Asset not found');
    }

    const project = await ctx.db.get(asset.projectId);
    if (project?.media && Array.isArray(project.media)) {
      const media = project.media.filter(
        (m: { assetId?: string }) => m?.assetId !== assetId,
      );
      await ctx.db.patch(asset.projectId, { media, updatedAt: Date.now() });
    }

    if (project?.outputAssetId === assetId) {
      await ctx.db.patch(asset.projectId, {
        outputAssetId: undefined,
        outputPath: undefined,
        updatedAt: Date.now(),
      });
    }

    if (asset.sizeBytes) {
      await bumpStorageBytes(ctx, userId, -asset.sizeBytes);
    }

    await ctx.db.delete(assetId);
    return { ok: true };
  },
});
