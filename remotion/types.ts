import type { TransitionKind } from './lib/transitions';

export interface Scene {
  src: string;
  type?: 'image' | 'video';
  duration: number;
  caption?: string;
  sectionTitle?: string;
  transition?: TransitionKind;
}

export interface WalkthroughScreen {
  id: string;
  title: string;
  description?: string;
  src: string;
  width?: number;
  height?: number;
  duration: number;
  transition?: TransitionKind;
  hotspots?: { x: number; y: number; label: string }[];
}

export interface WalkthroughProps {
  projectName: string;
  screens: WalkthroughScreen[];
  narrationAudioSrc?: string;
  fps?: number;
  width?: number;
  height?: number;
}
