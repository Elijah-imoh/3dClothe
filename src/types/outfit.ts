/**
 * FitMe 3D — Core Type Definitions
 */

export type ClothingCategory = 'shirt' | 'trousers' | 'shoes';

export type ColorTemperature = 'warm' | 'cool' | 'neutral';
export type ColorLightness = 'light' | 'mid' | 'dark';
export type ColorSaturation = 'low' | 'medium' | 'high';

export interface ColorItem {
  id: string;
  name: string;
  hex: string;
  category: ClothingCategory;
  temperature: ColorTemperature;
  lightness: ColorLightness;
  saturation: ColorSaturation;
  description?: string;
  isCustom?: boolean;
}

export interface OutfitState {
  shirt: string | null;     // color id or null
  trousers: string | null;  // color id or null
  shoes: string | null;     // color id or null
}

export type ScoreTier = 'Excellent' | 'Very Good' | 'Good' | 'Decent' | 'Weak';

export type EvaluationMode = 'single' | 'combination' | 'complete' | 'empty';

export interface OutfitRecommendation {
  id: string;
  targetCategory: ClothingCategory;
  recommendedColorId: string;
  targetColorName: string;
  recommendedColorName: string;
  hex: string;
  potentialScore: number;
  scoreDelta: number;
  reason: string;
  actionLabel: string; // e.g. "Apply to Shirt"
}

export interface OutfitEvaluation {
  mode: EvaluationMode;
  selectedCount: number; // 0, 1, 2, or 3
  score: number | null; // null if selectedCount < 2
  tier: ScoreTier | null;
  summary: string;
  explanation: string;
  guidance?: string;
  strengths: string[];
  considerations: string[];
  recommendations: OutfitRecommendation[];
  activeCombinationLabel?: string; // e.g. "NAVY + LIGHT KHAKI"
  breakdown?: {
    shirtTrousers?: number;
    trousersShoes?: number;
    shirtShoes?: number;
    overallBalance?: number;
  };
}
