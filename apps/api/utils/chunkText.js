/**
 * Split long narration into TTS-safe chunks (paragraph-aware).
 */
export function chunkText(text, maxLen = 4500) {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxLen) return [trimmed];

  const chunks = [];
  const paragraphs = trimmed.split(/\n\n+/);
  let buf = '';

  for (const para of paragraphs) {
    const next = buf ? `${buf}\n\n${para}` : para;
    if (next.length <= maxLen) {
      buf = next;
      continue;
    }
    if (buf) chunks.push(buf);
    if (para.length <= maxLen) {
      buf = para;
      continue;
    }
    for (let i = 0; i < para.length; i += maxLen) {
      chunks.push(para.slice(i, i + maxLen));
    }
    buf = '';
  }
  if (buf) chunks.push(buf);
  return chunks;
}

/** Default max chars per Chatterbox utterance (turbo truncates long inputs). */
export function chatterboxChunkMaxLen() {
  const fromEnv = Number(process.env.CHATTERBOX_MAX_CHARS);
  if (fromEnv > 80) return fromEnv;
  return 480;
}
