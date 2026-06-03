import { v } from 'convex/values';

export const assetKindValidator = v.union(
  v.literal('stock_video'),
  v.literal('upload'),
  v.literal('narration'),
  v.literal('subtitle'),
  v.literal('music'),
  v.literal('export'),
  v.literal('preview'),
);

export type AssetKind =
  | 'stock_video'
  | 'upload'
  | 'narration'
  | 'subtitle'
  | 'music'
  | 'export'
  | 'preview';
