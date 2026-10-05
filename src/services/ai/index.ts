import { AIStyleProvider, OutfitContext, StyleAdviceRequest, StyleAdviceResponse } from './types';
import { DeterministicStyleProvider } from './deterministicProvider';
import { GeminiStyleProvider } from './geminiProvider';
import { ColorItem, OutfitEvaluation } from '../../types/outfit';

/**
 * Pluggable AI Service Manager
 * Allows registration of any AI provider (Gemini, Claude, OpenAI, Local, etc.)
 */
class AIStyleService {
  private providers: Map<string, AIStyleProvider> = new Map();
  private activeProviderId: string = 'deterministic-local';

  constructor() {
    // Register built-in providers
    const local = new DeterministicStyleProvider();
    const gemini = new GeminiStyleProvider();

    this.registerProvider(local);
    this.registerProvider(gemini);

    // Default to gemini if configured, otherwise deterministic
    if (gemini.isConfigured()) {
      this.activeProviderId = gemini.id;
    } else {
      this.activeProviderId = local.id;
    }
  }

  registerProvider(provider: AIStyleProvider) {
    this.providers.set(provider.id, provider);
  }

  getAvailableProviders(): { id: string; name: string; isConfigured: boolean }[] {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isConfigured: p.isConfigured(),
    }));
  }

  setActiveProvider(providerId: string) {
    if (this.providers.has(providerId)) {
      this.activeProviderId = providerId;
    }
  }

  getActiveProvider(): AIStyleProvider {
    return this.providers.get(this.activeProviderId) || new DeterministicStyleProvider();
  }

  async getAdvice(
    shirt: ColorItem,
    trousers: ColorItem,
    shoes: ColorItem,
    context: OutfitContext,
    localEvaluation: OutfitEvaluation
  ): Promise<StyleAdviceResponse> {
    const provider = this.getActiveProvider();
    const req: StyleAdviceRequest = {
      shirt,
      trousers,
      shoes,
      context,
      localEvaluation,
    };
    return provider.getStyleAdvice(req);
  }
}

export const styleService = new AIStyleService();
export * from './types';
