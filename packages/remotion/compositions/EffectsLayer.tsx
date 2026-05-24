import React from 'react';
import { Circle } from '@remotion/shapes';
import { LightLeak } from '@remotion/light-leaks';
import { noise2D } from '@remotion/noise';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { useVisualTemplate } from '../lib/visualTemplate';

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const value = Number.parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => `${c}${c}`)
          .join('')
      : clean.slice(0, 6),
    16,
  );

  if (!Number.isFinite(value)) return { r: 124, g: 58, b: 237 };
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export const EffectsLayer: React.FC = () => {
  const theme = useVisualTemplate();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const effects = theme.effects || {};
  const filmGrain = effects.filmGrain ?? theme.filmGrain ?? 0;
  const chromatic = effects.chromaticAberration ?? theme.chromaticAberration;
  const glitch = effects.glitchIntensity ?? theme.glitchIntensity ?? 0;
  const pulseVignette = Boolean(effects.pulseVignette);
  const accent = hexToRgb(theme.palette.primary);
  const vignetteStrength = effects.vignette ?? theme.vignette ?? 0.35;
  const pulseVignetteOpacity = pulseVignette
    ? vignetteStrength *
      interpolate(frame % 90, [0, 45, 90], [0.85, 1.15, 0.85], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : vignetteStrength;
  const leakOpacity = interpolate(
    frame % 180,
    [0, 20, 70, 120, 180],
    [0, 0.22, 0.04, 0.18, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const grainDots = Array.from({ length: 54 }, (_, i) => {
    const x = Math.abs(noise2D(`grain-x-${i}`, frame * 0.09, i * 1.7)) * 1920;
    const y = Math.abs(noise2D(`grain-y-${i}`, i * 2.1, frame * 0.08)) * 1080;
    const opacity = Math.max(0, noise2D(`grain-o-${i}`, frame * 0.13, i)) * filmGrain;
    return { x, y, opacity };
  });

  const accentShapes = Array.from({ length: 5 }, (_, i) => {
    const drift = noise2D(`shape-${i}`, frame * 0.012, i) * 32;
    const opacity = interpolate(frame % 120, [0, 60, 120], [0.08, 0.18, 0.08]);
    return {
      x: 120 + ((i * 397) % 1660) + drift,
      y: 90 + ((i * 211) % 860) - drift * 0.35,
      radius: 16 + i * 5,
      opacity,
    };
  });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden', zIndex: 42 }}>
      {effects.lightLeak && (
        <AbsoluteFill style={{ opacity: leakOpacity, mixBlendMode: 'screen' }}>
          <LightLeak
            durationInFrames={Math.max(90, durationInFrames)}
            seed={theme.id.length}
            hueShift={effects.lightLeakHue ?? 0}
          />
        </AbsoluteFill>
      )}

      {effects.accentShapes && (
        <AbsoluteFill style={{ opacity: 0.9 }}>
          {accentShapes.map((shape, i) => (
            <Circle
              key={i}
              radius={shape.radius}
              fill="transparent"
              stroke={`rgba(${accent.r}, ${accent.g}, ${accent.b}, ${shape.opacity})`}
              strokeWidth={2}
              style={{
                position: 'absolute',
                left: shape.x,
                top: shape.y,
                filter: `drop-shadow(0 0 14px rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.22))`,
              }}
            />
          ))}
        </AbsoluteFill>
      )}

      {filmGrain > 0 && (
        <AbsoluteFill style={{ mixBlendMode: 'overlay' }}>
          {grainDots.map((dot, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: dot.x,
                top: dot.y,
                width: 2,
                height: 2,
                background: `rgba(255,255,255,${dot.opacity})`,
              }}
            />
          ))}
        </AbsoluteFill>
      )}

      {chromatic && (
        <AbsoluteFill
          style={{
            opacity: 0.18 + Math.max(0, glitch) * 0.1,
            boxShadow:
              'inset 5px 0 rgba(255,0,80,0.35), inset -5px 0 rgba(0,245,255,0.30)',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {pulseVignetteOpacity > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${Math.min(0.92, pulseVignetteOpacity)}) 100%)`,
            mixBlendMode: 'multiply',
          }}
        />
      )}
    </AbsoluteFill>
  );
};
