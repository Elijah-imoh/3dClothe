import { AIStyleProvider, StyleAdviceRequest, StyleAdviceResponse } from './types';

/**
 * Optional Gemini AI Provider Adapter
 * Connects via standard interface. If no key is set or call fails, returns null or falls back.
 */
export class GeminiStyleProvider implements AIStyleProvider {
  readonly id = 'gemini-ai';
  readonly name = 'Gemini Sartorial Advisor';

  isConfigured(): boolean {
    const key = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;
    return Boolean(key && key !== 'MY_GEMINI_API_KEY');
  }

  async getStyleAdvice(request: StyleAdviceRequest): Promise<StyleAdviceResponse> {
    const { shirt, trousers, shoes, context, localEvaluation } = request;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        throw new Error('No API key configured');
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({});

      const prompt = `You are an expert menswear stylist analyzing this specific 3D outfit:
Shirt: ${shirt.name} (${shirt.hex})
Trousers: ${trousers.name} (${trousers.hex})
Shoes: ${shoes.name} (${shoes.hex})
Intended Occasion: ${context}
Deterministic Score: ${localEvaluation.score}/100 (${localEvaluation.tier})

Give concise, punchy advice in 2 sentences max explaining the color harmony and occasion fit. Avoid fluff or generic preamble.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim() || localEvaluation.explanation;

      return {
        score: localEvaluation.score,
        tier: localEvaluation.tier,
        summary: localEvaluation.summary,
        advice: text,
        occasionVerdict: `Tailored for ${context}`,
        providerName: this.name,
      };
    } catch {
      // Graceful fallback to local evaluation
      return {
        score: localEvaluation.score,
        tier: localEvaluation.tier,
        summary: localEvaluation.summary,
        advice: localEvaluation.explanation,
        occasionVerdict: 'Evaluated locally via sartorial color matrix',
        providerName: 'Local Fallback',
      };
    }
  }
}
