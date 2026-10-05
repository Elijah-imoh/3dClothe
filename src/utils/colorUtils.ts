import { ClothingCategory, ColorItem, ColorLightness, ColorSaturation, ColorTemperature } from '../types/outfit';

/**
 * Color Utilities for FitMe 3D
 * Perceptual luminance, contrast ratios, and dynamic color analysis for custom colors.
 */

export function normalizeHex(input: string): string | null {
  if (!input) return null;
  let clean = input.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return null;
  }
  return `#${clean.toUpperCase()}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex) || '#000000';
  const num = parseInt(normalized.replace('#', ''), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  return { h, s, l };
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns whether text on a color swatch should be light or dark for readability
 */
export function getContrastingTextColor(hex: string): string {
  const lum = getRelativeLuminance(hex);
  return lum > 0.4 ? '#18181B' : '#F4F4F5';
}

/**
 * Analyzes any HEX color and derives hue, saturation, lightness, temperature,
 * and a natural descriptive name for menswear tailoring.
 */
export function detectColorProperties(hex: string): {
  hue: number;
  saturation: number;
  lightness: number;
  temperature: ColorTemperature;
  lightnessTier: ColorLightness;
  saturationTier: ColorSaturation;
  descriptiveName: string;
} {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  // 1. Determine Lightness Tier
  let lightnessTier: ColorLightness = 'mid';
  if (l > 0.65) lightnessTier = 'light';
  else if (l < 0.32) lightnessTier = 'dark';

  // 2. Determine Saturation Tier
  let saturationTier: ColorSaturation = 'low';
  if (s > 0.55) saturationTier = 'high';
  else if (s > 0.2) saturationTier = 'medium';

  // 3. Determine Temperature
  let temperature: ColorTemperature = 'neutral';
  if (s < 0.12 || l < 0.14 || l > 0.9) {
    temperature = 'neutral';
  } else if ((h >= 20 && h <= 165) || (h >= 340 && h <= 360)) {
    temperature = 'warm';
  } else if (h > 165 && h <= 270) {
    temperature = 'cool';
  } else {
    // Purples / Violets / Plums
    temperature = 'warm';
  }

  // 4. Derive Menswear-appropriate Name
  let nameRoot = 'Tone';
  if (s < 0.12) {
    if (l > 0.88) nameRoot = 'Off-White';
    else if (l > 0.65) nameRoot = 'Light Grey';
    else if (l > 0.35) nameRoot = 'Medium Grey';
    else if (l > 0.15) nameRoot = 'Charcoal';
    else nameRoot = 'Deep Black';
  } else if (h >= 15 && h < 45) {
    if (l < 0.35) nameRoot = 'Espresso Brown';
    else if (l < 0.55) nameRoot = 'Cognac / Tan';
    else nameRoot = 'Beige / Khaki';
  } else if (h >= 45 && h < 70) {
    if (l < 0.45) nameRoot = 'Olive Ochre';
    else nameRoot = 'Light Khaki';
  } else if (h >= 70 && h < 165) {
    if (l < 0.4) nameRoot = 'Forest / Olive';
    else if (l < 0.65) nameRoot = 'Sage Green';
    else nameRoot = 'Mint Celadon';
  } else if (h >= 165 && h < 210) {
    if (l < 0.35) nameRoot = 'Dark Teal';
    else if (l < 0.65) nameRoot = 'Slate Teal';
    else nameRoot = 'Ice Blue';
  } else if (h >= 210 && h < 255) {
    if (l < 0.3) nameRoot = 'Midnight Navy';
    else if (l < 0.6) nameRoot = 'Oxford Blue';
    else nameRoot = 'Light Sky Blue';
  } else if (h >= 255 && h < 290) {
    if (l < 0.35) nameRoot = 'Indigo';
    else nameRoot = 'Lavender Slate';
  } else if (h >= 290 && h < 340) {
    if (l < 0.35) nameRoot = 'Plum / Burgundy';
    else nameRoot = 'Dusty Rose';
  } else {
    if (l < 0.35) nameRoot = 'Burgundy Wine';
    else nameRoot = 'Terracotta';
  }

  const descriptiveName = `Custom ${nameRoot}`;

  return {
    hue: h,
    saturation: s,
    lightness: l,
    temperature,
    lightnessTier,
    saturationTier,
    descriptiveName,
  };
}

/**
 * Creates a valid ColorItem for any custom HEX entered by the user
 */
export function createCustomColorItem(
  rawHex: string,
  category: ClothingCategory,
  customLabel?: string
): ColorItem {
  const hex = normalizeHex(rawHex) || '#808080';
  const props = detectColorProperties(hex);
  const id = `custom-${category}-${hex.replace('#', '').toLowerCase()}`;

  return {
    id,
    name: customLabel?.trim() || `${props.descriptiveName} (${hex})`,
    hex,
    category,
    temperature: props.temperature,
    lightness: props.lightnessTier,
    saturation: props.saturationTier,
    description: `User-defined custom ${category} hue (${props.temperature}, ${props.lightnessTier} value).`,
    isCustom: true,
  };
}
