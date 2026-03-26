/**
 * Calculate relative luminance of a hex colour
 * Per WCAG 2.0 specification
 */
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;

  const [_r, _g, _b] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * _r + 0.7152 * _g + 0.0722 * _b;
}

/**
 * Calculate WCAG AA contrast ratio between two hex colours
 * Returns ratio (min 1, max 21)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if colour meets WCAG AA standard (4.5:1) against white
 */
export function meetsWCAGAA(hex: string, background = '#FFFFFF'): boolean {
  const ratio = getContrastRatio(hex, background);
  return ratio >= 4.5;
}

/**
 * Jupiter Blue fallback colour - used when primary colour fails contrast validation
 */
export const FALLBACK_COLOUR = '#2563EB';

/**
 * Get safe colour to display: use primary if it passes WCAG AA, otherwise fallback
 */
export function getSafeColour(hex: string): string {
  return meetsWCAGAA(hex) ? hex : FALLBACK_COLOUR;
}
