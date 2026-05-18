import React from 'react';
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';
import { resolveMediaSrc } from '../../lib/assets';
import type { WalkthroughScreen } from '../../types';
import { Hotspot } from './Hotspot';
import { ProgressBar } from './ProgressBar';
import { TextOverlay } from './TextOverlay';

export interface WalkthroughScreenSlideProps {
  screen: WalkthroughScreen;
  index: number;
  total: number;
}

export const WalkthroughScreenSlide: React.FC<WalkthroughScreenSlideProps> = ({
  screen,
  index,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = resolveMediaSrc(screen.src);

  const zoom = spring({
    frame,
    fps,
    from: 0.94,
    to: 1,
    config: { damping: 12, stiffness: 80 },
  });

  const opacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 10 },
  });

  const isVideo = screen.src.match(/\.(mp4|webm|mov)(\?|$)/i);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050508',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ProgressBar current={index + 1} total={total} />
      <div
        style={{
          transform: `scale(${zoom})`,
          opacity,
          maxWidth: '88%',
          maxHeight: '78%',
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        }}
      >
        {isVideo ? (
          <Video src={src} style={{ width: '100%', height: 'auto', display: 'block' }} muted />
        ) : (
          <Img src={src} style={{ width: '100%', height: 'auto', display: 'block' }} />
        )}
        {(screen.hotspots || []).map((h, i) => (
          <Hotspot key={`${h.label}-${i}`} x={h.x} y={h.y} label={h.label} />
        ))}
      </div>
      <TextOverlay title={screen.title} description={screen.description} />
    </AbsoluteFill>
  );
};
