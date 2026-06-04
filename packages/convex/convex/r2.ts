'use node';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { APP_USER_ID } from './lib/constants';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';
import { assetKindValidator } from './lib/assetKinds';
import { buildCdnUrl, buildR2Key } from './lib/r2Keys';
import { getR2Config, MAX_UPLOAD_BYTES } from './lib/r2Config';

const UPLOAD_TTL_SEC = 900;

export const generateUploadUrl = action({
  args: {
    projectId: v.id('projects'),
    kind: assetKindValidator,
    mime: v.string(),
    filename: v.string(),
    sizeBytes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = APP_USER_ID;

    const project = await ctx.runQuery(internal.internal.projects.getIfOwned, {
      projectId: args.projectId,
      userId,
    });
    if (!project) throw new Error('Project not found');

    const maxBytes = MAX_UPLOAD_BYTES[args.kind] ?? 100 * 1024 * 1024;
    if (args.sizeBytes != null && args.sizeBytes > maxBytes) {
      throw new Error(`File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB for ${args.kind})`);
    }

    const config = getR2Config();
    const r2Key = buildR2Key(userId, args.projectId, args.kind, args.mime, args.filename);
    const cdnUrl = buildCdnUrl(r2Key, config.publicBase);

    const client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: r2Key,
      ContentType: args.mime,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: UPLOAD_TTL_SEC });

    return {
      uploadUrl,
      r2Key,
      cdnUrl,
      expiresIn: UPLOAD_TTL_SEC,
      method: 'PUT' as const,
      headers: { 'Content-Type': args.mime },
    };
  },
});
