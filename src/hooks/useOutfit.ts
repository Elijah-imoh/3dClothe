import { useState, useMemo, useCallback } from 'react';
import { ClothingCategory, OutfitRecommendation, OutfitState, OutfitEvaluation, ColorItem } from '../types/outfit';
import { ALL_COLORS, COLOR_LOOKUP, DEFAULT_OUTFIT } from '../data/colors';
import { evaluateOutfitState } from '../utils/scoring';
import { createCustomColorItem } from '../utils/colorUtils';
import { OutfitContext, styleService, StyleAdviceResponse } from '../services/ai';

export function useOutfit() {
  const [outfit, setOutfit] = useState<OutfitState>({
    shirt: null,
    trousers: null,
    shoes: null,
  });

  const [customColors, setCustomColors] = useState<ColorItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>('shirt');
  const [context, setContext] = useState<OutfitContext>('Smart Casual');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiAdvice, setAiAdvice] = useState<StyleAdviceResponse | null>(null);

  // Dynamic color catalog (predefined + user-created custom colors)
  const allAvailableColors = useMemo(() => {
    return [...ALL_COLORS, ...customColors];
  }, [customColors]);

  const colorLookup = useMemo(() => {
    const map: Record<string, ColorItem> = { ...COLOR_LOOKUP };
    for (const c of customColors) {
      map[c.id] = c;
    }
    return map;
  }, [customColors]);

  // Active color items (or null if unselected)
  const shirtColor: ColorItem | null = useMemo(() => {
    return outfit.shirt ? colorLookup[outfit.shirt] || null : null;
  }, [outfit.shirt, colorLookup]);

  const trousersColor: ColorItem | null = useMemo(() => {
    return outfit.trousers ? colorLookup[outfit.trousers] || null : null;
  }, [outfit.trousers, colorLookup]);

  const shoesColor: ColorItem | null = useMemo(() => {
    return outfit.shoes ? colorLookup[outfit.shoes] || null : null;
  }, [outfit.shoes, colorLookup]);

  // Progressive deterministic evaluation (1-item, 2-item, or 3-item)
  const evaluation: OutfitEvaluation = useMemo(() => {
    return evaluateOutfitState(
      shirtColor,
      trousersColor,
      shoesColor,
      activeCategory,
      allAvailableColors
    );
  }, [shirtColor, trousersColor, shoesColor, activeCategory, allAvailableColors]);

  // Select color for specific category
  const selectColor = useCallback((category: ClothingCategory, colorId: string) => {
    setOutfit((prev) => ({
      ...prev,
      [category]: colorId,
    }));
    setActiveCategory(category);
    setAiAdvice(null);
  }, []);

  // Add custom color and immediately apply it
  const addCustomColor = useCallback((category: ClothingCategory, hex: string, label?: string) => {
    const newColor = createCustomColorItem(hex, category, label);
    setCustomColors((prev) => {
      // Avoid duplicate IDs
      const filtered = prev.filter((c) => c.id !== newColor.id);
      return [...filtered, newColor];
    });
    setOutfit((prev) => ({
      ...prev,
      [category]: newColor.id,
    }));
    setActiveCategory(category);
    setAiAdvice(null);
  }, []);

  // Clear a single category
  const clearCategory = useCallback((category: ClothingCategory) => {
    setOutfit((prev) => ({
      ...prev,
      [category]: null,
    }));
    setActiveCategory(category);
    setAiAdvice(null);
  }, []);

  // Clear all items to test 0-item / 1-item flow from scratch
  const clearAll = useCallback(() => {
    setOutfit({
      shirt: null,
      trousers: null,
      shoes: null,
    });
    setAiAdvice(null);
  }, []);

  // Apply one recommendation
  const applyRecommendation = useCallback((rec: OutfitRecommendation) => {
    setOutfit((prev) => ({
      ...prev,
      [rec.targetCategory]: rec.recommendedColorId,
    }));
    setActiveCategory(rec.targetCategory);
    setAiAdvice(null);
  }, []);

  // Reset to classic menswear baseline (White shirt + Light Khaki trousers + Dark Brown shoes)
  const resetOutfit = useCallback(() => {
    setOutfit({
      shirt: DEFAULT_OUTFIT.shirt,
      trousers: DEFAULT_OUTFIT.trousers,
      shoes: DEFAULT_OUTFIT.shoes,
    });
    setActiveCategory('shirt');
    setAiAdvice(null);
  }, []);

  // Request deeper AI or contextual styling advice
  const fetchAdvice = useCallback(async () => {
    if (!shirtColor && !trousersColor && !shoesColor) return;
    setIsAiLoading(true);
    try {
      const res = await styleService.getAdvice(
        shirtColor || COLOR_LOOKUP[DEFAULT_OUTFIT.shirt],
        trousersColor || COLOR_LOOKUP[DEFAULT_OUTFIT.trousers],
        shoesColor || COLOR_LOOKUP[DEFAULT_OUTFIT.shoes],
        context,
        evaluation
      );
      setAiAdvice(res);
    } catch {
      setAiAdvice({
        score: evaluation.score ?? 85,
        tier: evaluation.tier ?? 'Very Good',
        summary: evaluation.summary,
        advice: evaluation.explanation,
        occasionVerdict: `Evaluated for ${context}`,
        providerName: 'Local Engine',
      });
    } finally {
      setIsAiLoading(false);
    }
  }, [shirtColor, trousersColor, shoesColor, context, evaluation]);

  return {
    outfit,
    customColors,
    allAvailableColors,
    colorLookup,
    shirtColor,
    trousersColor,
    shoesColor,
    activeCategory,
    setActiveCategory,
    evaluation,
    context,
    setContext,
    selectColor,
    addCustomColor,
    clearCategory,
    clearAll,
    applyRecommendation,
    resetOutfit,
    fetchAdvice,
    isAiLoading,
    aiAdvice,
  };
}
