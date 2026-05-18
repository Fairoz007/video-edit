import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { drawInProgress, pulseOpacity } from '../lib/animations';

const BRACKET_SIZE = 28;
const STROKE = 2;
const COLOR = '#7C3AED';

function Bracket({
  corner,
  drawProgress,
  opacity,
}: {
  corner: 'top_left' | 'bottom_right';
  drawProgress: number;
  opacity: number;
}) {
  const len = BRACKET_SIZE * drawProgress;
  const isTopLeft = corner === 'top_left';

  return (
    <div
      style={{
        position: 'absolute',
        ...(isTopLeft ? { top: 28, left: 28 } : { bottom: 28, right: 28 }),
        width: len,
        height: len,
        opacity,
        ...(isTopLeft
          ? {
              borderTop: `${STROKE}px solid ${COLOR}`,
              borderLeft: `${STROKE}px solid ${COLOR}`,
            }
          : {
              borderBottom: `${STROKE}px solid ${COLOR}`,
              borderRight: `${STROKE}px solid ${COLOR}`,
            }),
      }}
    />
  );
}

export const CornerBrackets: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = drawInProgress(frame, 6, 20);
  const opacity = pulseOpacity(frame, 0.5, 0.9, 90);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Bracket corner="top_left" drawProgress={draw} opacity={opacity} />
      <Bracket corner="bottom_right" drawProgress={draw} opacity={opacity} />
    </AbsoluteFill>
  );
};
