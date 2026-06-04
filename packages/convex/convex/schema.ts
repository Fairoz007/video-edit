import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  userProfiles: defineTable({
    userId: v.string(),
    plan: v.union(v.literal('free'), v.literal('pro'), v.literal('team')),
    usage: v.object({
      rendersThisMonth: v.number(),
      ttsCharsThisMonth: v.number(),
      storageBytes: v.number(),
    }),
    youtubeConnected: v.boolean(),
  }).index('by_user', ['userId']),

  projects: defineTable({
    userId: v.string(),
    title: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('generating'),
      v.literal('rendering'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled'),
    ),
    input: v.any(),
    script: v.optional(v.any()),
    keywords: v.optional(v.any()),
    timeline: v.optional(v.any()),
    media: v.optional(v.any()),
    templateId: v.string(),
    voiceSettings: v.optional(v.any()),
    exportOptions: v.optional(v.any()),
    progress: v.number(),
    stage: v.string(),
    message: v.string(),
    outputPath: v.optional(v.string()),
    outputAssetId: v.optional(v.id('assets')),
    error: v.optional(v.string()),
    legacyLocalId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_user_legacy', ['userId', 'legacyLocalId']),

  assets: defineTable({
    projectId: v.id('projects'),
    userId: v.string(),
    kind: v.union(
      v.literal('stock_video'),
      v.literal('upload'),
      v.literal('narration'),
      v.literal('subtitle'),
      v.literal('music'),
      v.literal('export'),
      v.literal('preview'),
    ),
    r2Key: v.string(),
    cdnUrl: v.string(),
    mime: v.string(),
    sizeBytes: v.optional(v.number()),
    durationSec: v.optional(v.number()),
    meta: v.optional(v.any()),
  })
    .index('by_project', ['projectId'])
    .index('by_r2_key', ['r2Key']),

  renderJobs: defineTable({
    projectId: v.id('projects'),
    userId: v.string(),
    status: v.union(
      v.literal('queued'),
      v.literal('claimed'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled'),
    ),
    workerId: v.optional(v.string()),
    pipeline: v.string(),
    options: v.any(),
    progress: v.number(),
    stage: v.string(),
    message: v.string(),
    exportPreset: v.string(),
    outputAssetId: v.optional(v.id('assets')),
    error: v.optional(v.string()),
    claimedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index('by_status', ['status'])
    .index('by_project', ['projectId']),

  youtubeTokens: defineTable({
    userId: v.string(),
    encryptedRefreshToken: v.string(),
    channelId: v.optional(v.string()),
    channelTitle: v.optional(v.string()),
  }).index('by_user', ['userId']),

  youtubeUploads: defineTable({
    projectId: v.id('projects'),
    userId: v.string(),
    renderJobId: v.id('renderJobs'),
    youtubeVideoId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    privacyStatus: v.union(
      v.literal('private'),
      v.literal('unlisted'),
      v.literal('public'),
    ),
    scheduledAt: v.optional(v.number()),
    status: v.union(
      v.literal('pending'),
      v.literal('uploading'),
      v.literal('published'),
      v.literal('failed'),
    ),
    error: v.optional(v.string()),
  }).index('by_project', ['projectId']),
});
