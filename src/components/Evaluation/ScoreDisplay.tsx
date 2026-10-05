import React from 'react';
import { OutfitEvaluation, OutfitRecommendation } from '../../types/outfit';

interface ScoreDisplayProps {
  evaluation: OutfitEvaluation;
  onApplyRecommendation?: (rec: OutfitRecommendation) => void;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  evaluation,
  onApplyRecommendation,
}) => {
  const { mode, selectedCount, score, tier, summary, explanation, guidance, recommendations } = evaluation;

  return (
    <div className="space-y-3 pt-2">
      {/* [ COMPATIBILITY ] Header from screenshot */}
      <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
        [ COMPATIBILITY ]
      </div>

      {/* 0 or 1 item selected: Exactly "Choose another colour" from screenshot */}
      {selectedCount < 2 ? (
        <div className="text-sm font-sans text-zinc-500 py-1 font-normal">
          {guidance || 'Choose another colour'}
        </div>
      ) : (
        /* 2 or 3 items selected: Combination / Outfit Score */
        <div className="space-y-2 py-1">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light font-mono text-[#111111]">
                {score}
              </span>
              <span className="text-xs font-mono text-zinc-400">/100</span>
              <span className="text-xs font-medium font-sans text-zinc-800 ml-1">
                {tier} {mode === 'combination' ? 'combination' : 'outfit'}
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-sans leading-relaxed">
            {explanation}
          </p>

          {/* Actionable recommendations */}
          {recommendations && recommendations.length > 0 && onApplyRecommendation && (
            <div className="space-y-1.5 pt-2 border-t border-[#eaeaea]">
              <div className="font-mono text-[10px] text-zinc-400 uppercase">
                Recommended alternatives
              </div>
              <div className="space-y-1">
                {recommendations.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between text-xs py-1 px-1.5 hover:bg-zinc-50 rounded-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-zinc-300 shrink-0"
                        style={{ backgroundColor: rec.hex }}
                      />
                      <span className="font-sans text-zinc-800">
                        {rec.recommendedColorName.split(' (')[0]}
                      </span>
                      {rec.potentialScore > 0 && (
                        <span className="text-[10px] font-mono text-zinc-400">
                          {rec.potentialScore}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onApplyRecommendation(rec)}
                      className="font-mono text-[10px] text-zinc-600 hover:text-black uppercase cursor-pointer underline"
                    >
                      {rec.actionLabel || 'Apply'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
