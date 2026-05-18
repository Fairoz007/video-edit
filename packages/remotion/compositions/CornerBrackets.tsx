import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { drawInProgress, pulseOpacity } from '../lib/animations';
import { useVisualTemplate } from '../lib/visualTemplate';

const BRACKET_SIZE = 28;
const STROKE = 2;

function Bracket({
  corner,
  drawProgress,
  opacity,
  color,
}: {
  corner: 'top_left' | 'bottom_right';
  drawProgress: number;
  opacity: number;
  color: string;
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
              borderTop: `${STROKE}px solid ${color}`,
              borderLeft: `${STROKE}px solid ${color}`,
            }
          : {
              borderBottom: `${STROKE}px solid ${color}`,
              borderRight: `${STROKE}px solid ${color}`,
            }),
      }}
    />
  );
}

export const CornerBrackets: React.FC = () => {
  const theme = useVisualTemplate();
  if (!theme.cornerBrackets) return null;

  const frame = useCurrentFrame();
  const draw = drawInProgress(frame, 6, 20);
  const opacity = pulseOpacity(frame, 0.5, 0.9, 90);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <Bracket corner="top_left" drawProgress={draw} opacity={opacity} color={theme.bracketColor} />
      <Bracket corner="bottom_right" drawProgress={draw} opacity={opacity} color={theme.bracketColor} />
    </AbsoluteFill>
  );
};
