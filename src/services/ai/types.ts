import { ColorItem, OutfitEvaluation } from '../../types/outfit';

export type OutfitContext =
  | 'General'
  | 'Business Casual'
  | 'Smart Casual'
  | 'Weekend / Casual'
  | 'Evening / Dinner'
  | 'Formal';

export interface StyleAdviceRequest {
  shirt: ColorItem;
  trousers: ColorItem;
  shoes: ColorItem;
  context: OutfitContext;
  localEvaluation: OutfitEvaluation;
}

export interface StyleAdviceResponse {
  score: number | null;
  tier: string | null;
  summary: string;
  advice: string;
  occasionVerdict: string;
  providerName: string;
}

/**
 * Generic, Provider-Agnostic Interface
 * Connects any LLM or rule engine without modifying application code.
 */
export interface AIStyleProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  getStyleAdvice(request: StyleAdviceRequest): Promise<StyleAdviceResponse>;
}
