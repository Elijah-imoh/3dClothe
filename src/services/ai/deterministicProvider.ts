import { AIStyleProvider, StyleAdviceRequest, StyleAdviceResponse } from './types';

/**
 * Built-in Local Deterministic Provider
 * Zero latency, 100% offline, fully compliant with core prompt requirements.
 */
export class DeterministicStyleProvider implements AIStyleProvider {
  readonly id = 'deterministic-local';
  readonly name = 'Local Sartorial Engine';

  isConfigured(): boolean {
    return true; // Always ready
  }

  async getStyleAdvice(request: StyleAdviceRequest): Promise<StyleAdviceResponse> {
    const { shirt, trousers, shoes, context, localEvaluation } = request;

    // Generate contextual reasoning based on occasion
    let occasionVerdict = '';
    switch (context) {
      case 'Business Casual':
        if (shoes.id === 'shoe-black' || shoes.id === 'shoe-dark-brown') {
          occasionVerdict = 'Superb for the workplace: professional leather shoes and balanced tones command respect.';
        } else {
          occasionVerdict = 'Acceptable for modern relaxed offices, though leather footwear would elevate corporate authority.';
        }
        break;
      case 'Smart Casual':
        occasionVerdict = 'Flawless smart-casual versatility; ideal for client lunches, creative studios, and dinner dates.';
        break;
      case 'Weekend / Casual':
        if (shoes.id === 'shoe-white') {
          occasionVerdict = 'Peak weekend ease: clean footwear keeps the tailoring grounded and accessible.';
        } else {
          occasionVerdict = 'Refined off-duty styling that balances relaxed ease with intentional neatness.';
        }
        break;
      case 'Evening / Dinner':
        if (shirt.lightness === 'dark' || trousers.lightness === 'dark') {
          occasionVerdict = 'Sleek nocturnal balance suitable for upscale restaurants and cocktail lounges.';
        } else {
          occasionVerdict = 'Lighter evening palette: best suited for sunset dining or warm outdoor venues.';
        }
        break;
      case 'Formal':
        if (shoes.id === 'shoe-black' && (trousers.id === 'trouser-black' || trousers.id === 'trouser-charcoal')) {
          occasionVerdict = 'Maintains strict formal decorum with seamless monochromatic discipline.';
        } else {
          occasionVerdict = 'Leans smart-casual rather than strictly formal; consider charcoal/black trousers with black oxfords for black-tie or ceremonial events.';
        }
        break;
      default:
        occasionVerdict = 'Well-calibrated color story suitable for diverse everyday settings.';
    }

    return {
      score: localEvaluation.score,
      tier: localEvaluation.tier,
      summary: localEvaluation.summary,
      advice: localEvaluation.explanation,
      occasionVerdict,
      providerName: this.name,
    };
  }
}
