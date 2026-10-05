import React from 'react';
import { ColorItem } from '../../types/outfit';

interface OutfitSummaryProps {
  shirtColor: ColorItem | null;
  trousersColor: ColorItem | null;
  shoesColor: ColorItem | null;
}

export const OutfitSummary: React.FC<OutfitSummaryProps> = ({
  shirtColor,
  trousersColor,
  shoesColor,
}) => {
  const items = [
    { label: 'SHIRT', color: shirtColor },
    { label: 'TROUSERS', color: trousersColor },
    { label: 'SHOES', color: shoesColor },
  ];

  return (
    <div className="space-y-3 pt-2">
      {/* [ OUTFIT ] Header from screenshot */}
      <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
        [ OUTFIT ]
      </div>

      <div className="space-y-2 text-xs font-mono">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-1 text-zinc-700"
          >
            <span className="tracking-wide text-[11px] text-zinc-500">{item.label}</span>

            {item.color ? (
              <div className="flex items-center gap-1.5 font-sans text-zinc-900 font-medium">
                <span
                  className="w-2 h-2 rounded-full border border-zinc-300"
                  style={{ backgroundColor: item.color.hex }}
                />
                <span>{item.color.name.split(' (')[0]}</span>
              </div>
            ) : (
              <span className="font-serif italic text-zinc-400 text-xs">
                Not selected
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
