export class RenderCancelledError extends Error {
  constructor(message = 'Render cancelled') {
    super(message);
    this.name = 'RenderCancelledError';
  }
}

/** Matches Remotion cancel messages (not re-exported from @remotion/renderer). */
const REMOTION_CANCEL_MARKERS = [
  'renderMedia() got cancelled',
  'renderFrames() got cancelled',
  'renderStill() got cancelled',
  'stitchFramesToVideo() got cancelled',
];

export function isUserCancelledRender(err) {
  const message = err?.message;
  if (typeof message !== 'string') return false;
  return REMOTION_CANCEL_MARKERS.some((m) => message.includes(m));
}
