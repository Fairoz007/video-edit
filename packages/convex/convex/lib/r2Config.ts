export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    throw new Error(
      'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL in Convex env.',
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBase,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

/** Max upload size by kind (bytes). */
export const MAX_UPLOAD_BYTES: Record<string, number> = {
  stock_video: 500 * 1024 * 1024,
  upload: 500 * 1024 * 1024,
  narration: 50 * 1024 * 1024,
  subtitle: 2 * 1024 * 1024,
  music: 30 * 1024 * 1024,
  export: 2 * 1024 * 1024 * 1024,
  preview: 500 * 1024 * 1024,
};
