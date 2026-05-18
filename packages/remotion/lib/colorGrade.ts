/** CSS filter presets for per-scene color grading. */
export type ColorGrade =
  | 'none'
  | 'warm_golden'
  | 'cool_blue'
  | 'cinematic_teal_orange'
  | 'warm_contrast'
  | 'desaturated';

const GRADES: Record<ColorGrade, string> = {
  none: 'none',
  warm_golden: 'saturate(1.12) contrast(1.08) sepia(0.12) hue-rotate(-8deg) brightness(1.02)',
  cool_blue: 'saturate(0.92) contrast(1.06) hue-rotate(12deg) brightness(0.98)',
  cinematic_teal_orange:
    'saturate(1.15) contrast(1.1) sepia(0.08) hue-rotate(-18deg) brightness(1.03)',
  warm_contrast: 'saturate(1.18) contrast(1.14) brightness(1.04)',
  desaturated: 'saturate(0.35) contrast(1.12) brightness(1.05)',
};

export function colorGradeFilter(grade?: ColorGrade | string): string {
  if (!grade || grade === 'none') return GRADES.none;
  return GRADES[grade as ColorGrade] || GRADES.cinematic_teal_orange;
}

/** Cycle grades by section index for visual variety with a unified look. */
export function colorGradeForSection(index: number): ColorGrade {
  const cycle: ColorGrade[] = [
    'warm_golden',
    'cool_blue',
    'cinematic_teal_orange',
    'warm_contrast',
  ];
  return cycle[index % cycle.length];
}
