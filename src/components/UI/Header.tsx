import React from 'react';

interface HeaderProps {
  onReset: () => void;
  onClearAll?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onClearAll }) => {
  return (
    <header className="w-full bg-[#fafafa] border-b border-[#eaeaea] sticky top-0 z-40 select-none">
      <div className="w-full px-6 sm:px-10 h-16 flex items-center justify-between">
        {/* Left: FitMe 3D in classical editorial typography from screenshot */}
        <div className="flex items-baseline gap-2">
          <span className="font-serif-brand text-2xl tracking-normal text-[#111111] font-medium">
            FitMe
          </span>
          <span className="text-[11px] font-sans tracking-wide text-zinc-500 font-normal">
            3D
          </span>
        </div>

        {/* Right: [ OUTFIT STUDIO ] from screenshot */}
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs text-zinc-500 tracking-wider">
            [ OUTFIT STUDIO ]
          </div>

          <div className="flex items-center gap-2 pl-2">
            <button
              type="button"
              onClick={onReset}
              title="Reset to classic menswear baseline (White + Khaki + Brown)"
              className="text-[11px] font-mono text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              [ Reset ]
            </button>
            {onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                title="Clear all selections to blank state"
                className="text-[11px] font-mono text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                [ Clear ]
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
