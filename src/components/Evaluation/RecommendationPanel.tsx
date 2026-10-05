import React, { useState } from 'react';
import { OutfitRecommendation } from '../../types/outfit';
import { StyleAdviceResponse } from '../../services/ai';

interface RecommendationPanelProps {
  recommendations: OutfitRecommendation[];
  onApplyRecommendation: (rec: OutfitRecommendation) => void;
  onFetchAdvice: () => void;
  isAiLoading: boolean;
  aiAdvice: StyleAdviceResponse | null;
  onReset: () => void;
  onClearAll?: () => void;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendations,
  onApplyRecommendation,
  onFetchAdvice,
  isAiLoading,
  aiAdvice,
  onReset,
  onClearAll,
}) => {
  const [justAppliedId, setJustAppliedId] = useState<string | null>(null);

  const handleApply = (rec: OutfitRecommendation) => {
    onApplyRecommendation(rec);
    setJustAppliedId(rec.id);
    setTimeout(() => setJustAppliedId(null), 1500);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between border-hairline-b pb-2">
        <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
          [ 03 / Actionable Recommendations ]
        </span>
        <span className="font-mono text-[11px] text-zinc-600">
          ({recommendations.length} AVAILABLE)
        </span>
      </div>

      {/* Action Buttons: Recommend, Reset, Clear */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onFetchAdvice}
          disabled={isAiLoading}
          className="flex-1 py-2.5 px-3 bg-white text-zinc-950 font-mono text-xs uppercase tracking-wider font-semibold rounded-xs hover:bg-zinc-200 transition-colors flex items-center justify-between cursor-pointer disabled:opacity-50"
        >
          <span>{isAiLoading ? 'Analyzing Harmony…' : 'Recommend Alternatives'}</span>
          <span className="font-normal">→</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          title="Reset to default baseline (White + Light Khaki + Brown)"
          className="py-2.5 px-2.5 border border-zinc-800 hover:border-zinc-600 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-white rounded-xs transition-colors cursor-pointer"
        >
          [ Reset ]
        </button>

        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            title="Clear all selections to test single piece"
            className="py-2.5 px-2 border border-zinc-800 hover:border-zinc-600 font-mono text-xs uppercase tracking-wider text-zinc-500 hover:text-rose-400 rounded-xs transition-colors cursor-pointer"
          >
            [ Clear ]
          </button>
        )}
      </div>

      {/* Deep Stylist Advice Box (if fetched) */}
      {aiAdvice && (
        <div className="p-3.5 bg-white/[0.03] border-hairline border rounded-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase">
            <span>Sartorial Note</span>
            <span>{aiAdvice.providerName}</span>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed font-normal">
            {aiAdvice.advice}
          </p>
          {aiAdvice.occasionVerdict && (
            <p className="text-[11px] font-mono text-emerald-400 pt-1">
              ✓ {aiAdvice.occasionVerdict}
            </p>
          )}
        </div>
      )}

      {/* Actionable Recommendations Table List */}
      {recommendations.length > 0 ? (
        <div className="space-y-1.5 border-hairline-t pt-2">
          {recommendations.map((rec, idx) => {
            const isApplied = justAppliedId === rec.id;
            const indexStr = `(0${idx + 1})`;
            const actionText = rec.actionLabel || `Apply to ${rec.targetCategory.charAt(0).toUpperCase() + rec.targetCategory.slice(1)}`;

            return (
              <div
                key={rec.id}
                className="py-2.5 px-2 border-hairline-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 group hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="font-mono text-[11px] text-zinc-600 shrink-0">
                    {indexStr}
                  </span>

                  {/* Swatch square */}
                  <div
                    className="w-4 h-4 rounded-xs border border-white/20 shrink-0 shadow-sm"
                    style={{ backgroundColor: rec.hex }}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="uppercase text-zinc-400">
                        {rec.targetCategory}
                      </span>
                      <span className="text-zinc-600">→</span>
                      <span className="font-semibold text-white truncate">
                        {rec.recommendedColorName.split(' (')[0]}
                      </span>
                      {rec.potentialScore > 0 && (
                        <span className="text-[10px] text-zinc-400 font-mono pl-1">
                          [{rec.potentialScore}/100]
                        </span>
                      )}
                      {rec.scoreDelta > 0 && (
                        <span className="text-[10px] text-emerald-400 font-mono pl-0.5 font-medium">
                          +{rec.scoreDelta} PTS
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-1 max-w-[260px] sm:max-w-[340px]">
                      {rec.reason}
                    </p>
                  </div>
                </div>

                {/* Explicit Action Button with Destination Target */}
                <button
                  type="button"
                  onClick={() => handleApply(rec)}
                  disabled={isApplied}
                  className={`font-mono text-xs tracking-wider uppercase px-2.5 py-1 rounded-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto ${
                    isApplied
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'border border-zinc-700 hover:border-white text-zinc-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isApplied ? '[ Applied ✓ ]' : `[ ${actionText} ]`}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 border-hairline border rounded-xs text-[11px] font-mono text-zinc-500 text-center">
          [ No alternative substitutions needed — Current selection is optimal ]
        </div>
      )}
    </div>
  );
};
