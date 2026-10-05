import React, { useState } from 'react';
import { ClothingCategory, ColorItem } from '../../types/outfit';
import { CLOTHING_SLOTS } from '../../data/clothing';
import { ColorSwatch } from './ColorSwatch';
import { CustomColorInput } from './CustomColorInput';
import { Plus } from 'lucide-react';

interface ClothingSelectorProps {
  shirtColor: ColorItem | null;
  trousersColor: ColorItem | null;
  shoesColor: ColorItem | null;
  customColors: ColorItem[];
  onSelectColor: (category: ClothingCategory, colorId: string) => void;
  onAddCustomColor: (category: ClothingCategory, hex: string, label?: string) => void;
  onClearCategory: (category: ClothingCategory) => void;
  activeCategory: ClothingCategory;
  onActiveCategoryChange: (category: ClothingCategory) => void;
}

export const ClothingSelector: React.FC<ClothingSelectorProps> = ({
  shirtColor,
  trousersColor,
  shoesColor,
  customColors,
  onSelectColor,
  onAddCustomColor,
  onClearCategory,
  activeCategory,
  onActiveCategoryChange,
}) => {
  const [customInputOpen, setCustomInputOpen] = useState<boolean>(false);

  const getSelectedColor = (category: ClothingCategory): ColorItem | null => {
    switch (category) {
      case 'shirt':
        return shirtColor;
      case 'trousers':
        return trousersColor;
      case 'shoes':
        return shoesColor;
    }
  };

  const currentSlot = CLOTHING_SLOTS.find((s) => s.category === activeCategory) || CLOTHING_SLOTS[0];
  const categoryCustomColors = customColors.filter((c) => c.category === activeCategory);
  const activeSlotColors = [...currentSlot.colors, ...categoryCustomColors];
  const activeSelectedColor = getSelectedColor(activeCategory);

  return (
    <div className="space-y-6">
      {/* 1. [ CLOTHING ] Section matching screenshot */}
      <div className="space-y-3">
        <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
          [ CLOTHING ]
        </div>

        <div className="space-y-2">
          {CLOTHING_SLOTS.map((slot, index) => {
            const currentColor = getSelectedColor(slot.category);
            const isActive = activeCategory === slot.category;
            const indexStr = `0${index + 1}`;

            return (
              <div
                key={slot.category}
                onClick={() => {
                  onActiveCategoryChange(slot.category);
                  setCustomInputOpen(false);
                }}
                className={`w-full py-2 px-2 flex items-center justify-between text-left cursor-pointer rounded-xs transition-colors ${
                  isActive ? 'bg-zinc-100/80' : 'hover:bg-zinc-50'
                }`}
              >
                {/* Left: 01 Shirt */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-zinc-400">
                    {indexStr}
                  </span>
                  <span
                    className={`text-sm tracking-tight ${
                      isActive ? 'font-semibold text-black' : 'font-normal text-zinc-800'
                    }`}
                  >
                    {slot.label}
                  </span>
                </div>

                {/* Right: Not selected / Selected Color name */}
                <div className="flex items-center gap-2">
                  {currentColor ? (
                    <div className="flex items-center gap-1.5 font-sans text-xs text-zinc-800">
                      <span
                        className="w-2 h-2 rounded-full border border-zinc-300 shrink-0"
                        style={{ backgroundColor: currentColor.hex }}
                      />
                      <span>{currentColor.name.split(' (')[0]}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearCategory(slot.category);
                        }}
                        title={`Clear ${slot.label}`}
                        className="text-[10px] text-zinc-400 hover:text-rose-500 px-1 ml-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="font-serif italic text-xs text-zinc-400">
                      Not selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. [ COLOUR ] Section matching screenshot */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
            [ COLOUR ]
          </div>
          <span className="font-mono text-[11px] text-zinc-400">
            For {currentSlot.label}
          </span>
        </div>

        {/* Horizontal circular swatches row from screenshot */}
        <div className="pb-3 border-b border-[#eaeaea]">
          <div className="flex items-start gap-2 overflow-x-auto pb-1.5 custom-scroll">
            {activeSlotColors.map((color) => (
              <ColorSwatch
                key={color.id}
                color={color}
                isSelected={activeSelectedColor?.id === color.id}
                onSelect={(colorId) => onSelectColor(activeCategory, colorId)}
              />
            ))}

            {/* + Custom colour button */}
            <button
              type="button"
              onClick={() => setCustomInputOpen((prev) => !prev)}
              title="Add custom HEX colour"
              className={`flex flex-col items-center gap-1.5 p-1 rounded-sm cursor-pointer shrink-0 transition-all ${
                customInputOpen ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-dashed flex items-center justify-center transition-colors ${
                  customInputOpen
                    ? 'border-black bg-black text-white'
                    : 'border-zinc-400 text-zinc-500 hover:border-black hover:text-black'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-sans text-zinc-500 max-w-[54px] truncate text-center">
                Custom
              </span>
            </button>
          </div>

          {/* Collapsible custom input form */}
          {customInputOpen && (
            <CustomColorInput
              category={activeCategory}
              onAddCustomColor={onAddCustomColor}
              onClose={() => setCustomInputOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
