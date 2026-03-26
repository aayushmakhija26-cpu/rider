import { describe, it, expect } from 'vitest';
import { getContrastRatio, meetsWCAGAA, getSafeColour, FALLBACK_COLOUR } from './contrast';

describe('contrast validation', () => {
  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratio for black and white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should calculate contrast ratio symmetrically', () => {
      const ratio1 = getContrastRatio('#0066CC', '#FFFFFF');
      const ratio2 = getContrastRatio('#FFFFFF', '#0066CC');
      expect(ratio1).toBeCloseTo(ratio2, 2);
    });

    it('should return 1 for same colour', () => {
      const ratio = getContrastRatio('#2563EB', '#2563EB');
      expect(ratio).toBeCloseTo(1, 2);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should identify colours that meet WCAG AA (4.5:1) against white', () => {
      // Black (highest contrast)
      expect(meetsWCAGAA('#000000')).toBe(true);
      // Dark blue
      expect(meetsWCAGAA('#0000CC')).toBe(true);
      // Jupiter Blue
      expect(meetsWCAGAA('#2563EB')).toBe(true);
      // Dark green
      expect(meetsWCAGAA('#003D2D')).toBe(true);
    });

    it('should identify colours that fail WCAG AA against white', () => {
      // Bright yellow
      expect(meetsWCAGAA('#FFFF00')).toBe(false);
      // Light cyan
      expect(meetsWCAGAA('#AFFFFF')).toBe(false);
      // Light pink
      expect(meetsWCAGAA('#FFB3D9')).toBe(false);
    });

    it('should accept custom background colour', () => {
      // Black on black should fail
      expect(meetsWCAGAA('#000000', '#000000')).toBe(false);
      // White on white should fail
      expect(meetsWCAGAA('#FFFFFF', '#FFFFFF')).toBe(false);
    });

    it('should handle black and white', () => {
      expect(meetsWCAGAA('#000000')).toBe(true); // Black on white
      expect(meetsWCAGAA('#FFFFFF')).toBe(false); // White on white
    });
  });

  describe('getSafeColour', () => {
    it('should return the colour if it passes contrast validation', () => {
      const safeColour = getSafeColour('#0066CC');
      expect(safeColour).toBe('#0066CC');
    });

    it('should return fallback colour if contrast fails', () => {
      const safeColour = getSafeColour('#FFFF00');
      expect(safeColour).toBe(FALLBACK_COLOUR);
    });

    it('should return Jupiter Blue as fallback', () => {
      expect(FALLBACK_COLOUR).toBe('#2563EB');
    });

    it('should use Jupiter Blue when passing contrast check', () => {
      const safeColour = getSafeColour('#2563EB');
      expect(safeColour).toBe('#2563EB');
    });
  });

  describe('edge cases', () => {
    it('should handle hex colours in different cases', () => {
      // Uppercase
      expect(meetsWCAGAA('#2563EB')).toBe(true);
      // Lowercase (if supported)
      expect(meetsWCAGAA('#2563eb')).toBe(true);
      // Mixed case (if supported)
      expect(meetsWCAGAA('#2563Eb')).toBe(true);
    });

    it('should maintain consistency across multiple calls', () => {
      const colour = '#0066CC';
      const result1 = meetsWCAGAA(colour);
      const result2 = meetsWCAGAA(colour);
      expect(result1).toBe(result2);
    });
  });
});
