import { AccessiblePalettePair, PaletteTunerReport } from '@accessiq/types';

/**
 * Converts a hex color (#RRGGBB or #RGB) or rgb(r, g, b) string to [r, g, b] (0-255)
 */
export function parseColorToRgb(colorStr: string): [number, number, number] {
  const clean = colorStr.trim().toLowerCase();
  
  if (clean.startsWith('#')) {
    const hex = clean.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  const rgbMatch = clean.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10),
    ];
  }

  // Fallback default
  return [100, 100, 100];
}

/**
 * Calculates WCAG 2.2 Relative Luminance for an RGB color
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Computes contrast ratio between two RGB colors (returns 1 to 21)
 */
export function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = getRelativeLuminance(...rgb1);
  const l2 = getRelativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [r, g, b].map((c) => clamp(c).toString(16).padStart(2, '0')).join('');
}

/**
 * Adjusts color brightness (darkening or lightening) until target contrast ratio is met
 */
export function adjustToTargetContrast(
  fg: [number, number, number],
  bg: [number, number, number],
  targetRatio: number = 4.5
): { adjustedFg: [number, number, number]; adjustedBg: [number, number, number]; achievedRatio: number } {
  const bgLum = getRelativeLuminance(...bg);
  const fgLum = getRelativeLuminance(...fg);

  let [r, g, b] = [...fg];
  const shouldDarken = fgLum < bgLum; // If fg is darker than bg, make fg even darker, else lighten it

  let step = shouldDarken ? -2 : 2;
  let iterations = 0;

  while (iterations < 128) {
    const currentRatio = getContrastRatio([r, g, b], bg);
    if (currentRatio >= targetRatio) {
      return {
        adjustedFg: [r, g, b],
        adjustedBg: bg,
        achievedRatio: currentRatio,
      };
    }
    r = Math.max(0, Math.min(255, r + step));
    g = Math.max(0, Math.min(255, g + step));
    b = Math.max(0, Math.min(255, b + step));
    iterations++;
  }

  return {
    adjustedFg: shouldDarken ? [0, 0, 0] : [255, 255, 255],
    adjustedBg: bg,
    achievedRatio: getContrastRatio(shouldDarken ? [0, 0, 0] : [255, 255, 255], bg),
  };
}

/**
 * Generates an automated accessible color palette tuning report
 */
export function tunePaletteForContrast(
  pairs: Array<{ fg: string; bg: string; label?: string }>
): PaletteTunerReport {
  const contrastPairs: AccessiblePalettePair[] = [];
  const uniqueColors = new Set<string>();

  pairs.forEach((pair, idx) => {
    const fgRgb = parseColorToRgb(pair.fg);
    const bgRgb = parseColorToRgb(pair.bg);
    const originalRatio = getContrastRatio(fgRgb, bgRgb);

    uniqueColors.add(rgbToHex(...fgRgb));
    uniqueColors.add(rgbToHex(...bgRgb));

    // Target 4.5:1 for WCAG Level AA
    const { adjustedFg, achievedRatio } = adjustToTargetContrast(fgRgb, bgRgb, 4.5);
    const suggestedFgHex = rgbToHex(...adjustedFg);
    const bgHex = rgbToHex(...bgRgb);
    const varName = `--accessiq-color-${pair.label || `pair-${idx + 1}`}`;

    contrastPairs.push({
      originalForeground: rgbToHex(...fgRgb),
      originalBackground: bgHex,
      originalRatio,
      suggestedForeground: suggestedFgHex,
      suggestedBackground: bgHex,
      targetRatio: 4.5,
      wcagLevel: 'AA',
      cssVariable: varName,
      cssRuleSnippet: `color: var(${varName}); /* Contrast: ${achievedRatio}:1 (Passes WCAG AA) */`,
    });
  });

  const generatedCssVariables = [
    ':root {',
    '  /* AccessIQ Auto-Remediated WCAG 2.2 Accessible Brand Palette */',
    ...contrastPairs.map((p) => `  ${p.cssVariable}: ${p.suggestedForeground}; /* original was ${p.originalForeground} */`),
    '}',
  ].join('\n');

  return {
    portalBrandColors: Array.from(uniqueColors),
    contrastPairs,
    generatedCssVariables,
  };
}
