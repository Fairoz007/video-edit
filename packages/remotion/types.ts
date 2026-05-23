import type { TransitionKind } from './lib/transitions';
import type { ColorGrade } from './lib/colorGrade';

export interface SceneLowerThird {
  name?: string;
  title?: string;
  fromFrame?: number;
  durationFrames?: number;
}

export interface Scene {
  src: string;
  type?: 'image' | 'video';
  duration: number;
  trimStart?: number;
  trimEnd?: number;
  playbackRate?: number;
  loop?: boolean;
  audioVolume?: number;
  caption?: string;
  sectionTitle?: string;
  sectionIndex?: number;
  transition?: TransitionKind;
  colorGrade?: ColorGrade | string;
  kenBurnsFrom?: number;
  kenBurnsTo?: number;
  panStartX?: number;
  panEndX?: number;
  lowerThird?: SceneLowerThird;
}

export interface ChapterBadgeSpec {
  label: string;
  fromFrame: number;
  durationFrames: number;
}

export interface WordCue {
  word: string;
  startSec: number;
  endSec: number;
}

export interface WalkthroughScreen {
  id: string;
  title: string;
  description?: string;
  src: string;
  type?: 'image' | 'video';
  width?: number;
  height?: number;
  duration: number;
  trimStart?: number;
  trimEnd?: number;
  playbackRate?: number;
  loop?: boolean;
  audioVolume?: number;
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
