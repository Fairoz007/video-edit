import React from 'react';
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { resolveMediaSrc } from '../../lib/assets';
import { TransitionSeries } from '@remotion/transitions';
import type { TransitionKind } from '../../lib/transitions';
import {
  transitionPresentation,
  transitionTiming,
} from '../../lib/transitions';
import type { WalkthroughProps } from '../../types';
import { WalkthroughScreenSlide } from './ScreenSlide';

const DEFAULT_TRANSITIONS: TransitionKind[] = ['fade', 'slide', 'fade', 'wipe'];

export const WalkthroughComposition: React.FC<WalkthroughProps> = ({
  screens,
  narrationAudioSrc,
}) => {
  const { fps } = useVideoConfig();

  if (!screens.length) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#050508',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#94a3b8',
          fontSize: 32,
        }}
      >
        No screens in walkthrough
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#050508' }}>
      <TransitionSeries>
        {screens.map((screen, index) => {
          const durationInFrames = Math.max(fps, Math.round(screen.duration * fps));
          const transitionKind =
            screen.transition || DEFAULT_TRANSITIONS[index % DEFAULT_TRANSITIONS.length];

          return (
            <React.Fragment key={screen.id || `screen-${index}`}>
              <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                <WalkthroughScreenSlide screen={screen} index={index} total={screens.length} />
              </TransitionSeries.Sequence>
              {index < screens.length - 1 && (
                <TransitionSeries.Transition
                  presentation={transitionPresentation(transitionKind) as never}
                  timing={transitionTiming(transitionKind)}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      {narrationAudioSrc && (
        <Sequence from={0}>
          <Audio src={resolveMediaSrc(narrationAudioSrc)} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
