import React from 'react';
import { ColorItem } from '../../types/outfit';

interface ColorSwatchProps {
  color: ColorItem;
  isSelected: boolean;
  onSelect: (colorId: string) => void;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(color.id)}
      title={`${color.name} (${color.temperature} · ${color.lightness})`}
      aria-label={`Select ${color.name}`}
      aria-pressed={isSelected}
      className="group flex flex-col items-center gap-1.5 p-1 rounded-sm cursor-pointer focus-visible:outline-none shrink-0"
    >
      {/* Circular Swatch from Screenshot */}
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all ${
          isSelected
            ? 'ring-2 ring-black ring-offset-2 ring-offset-[#fafafa] scale-105'
            : 'border border-zinc-300 group-hover:scale-105 group-hover:border-zinc-500'
        }`}
        style={{ backgroundColor: color.hex }}
      />

      {/* Label Underneath Swatch */}
      <span
        className={`text-[10px] font-sans truncate max-w-[54px] text-center leading-tight transition-colors ${
          isSelected ? 'text-black font-semibold' : 'text-zinc-500 group-hover:text-zinc-800'
        }`}
      >
        {color.name.split(' (')[0]}
      </span>
    </button>
  );
};
