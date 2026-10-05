import React, { useState, useEffect } from 'react';
import { ClothingCategory } from '../../types/outfit';
import { normalizeHex, detectColorProperties } from '../../utils/colorUtils';
import { Pipette } from 'lucide-react';

interface CustomColorInputProps {
  category: ClothingCategory;
  onAddCustomColor: (category: ClothingCategory, hex: string, label?: string) => void;
  onClose: () => void;
}

export const CustomColorInput: React.FC<CustomColorInputProps> = ({
  category,
  onAddCustomColor,
  onClose,
}) => {
  const [hexInput, setHexInput] = useState<string>('#3F5A47');
  const [customName, setCustomName] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);

  const normalized = normalizeHex(hexInput);
  const colorProps = normalized ? detectColorProperties(normalized) : null;

  useEffect(() => {
    setIsValid(Boolean(normalized));
  }, [normalized]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && val.length > 0) {
      val = `#${val}`;
    }
    setHexInput(val);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexInput(e.target.value.toUpperCase());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (normalized) {
      onAddCustomColor(category, normalized, customName.trim() || undefined);
      onClose();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-white border border-[#eaeaea] rounded-xs space-y-2.5 font-mono text-xs shadow-xs mt-2"
    >
      <div className="flex items-center justify-between border-b border-[#eaeaea] pb-1.5">
        <span className="text-[11px] text-zinc-500 uppercase tracking-wider">
          [ Custom {category} Colour ]
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-black cursor-pointer text-[10px]"
        >
          [✕]
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-7 h-7 rounded-full border border-zinc-300 overflow-hidden shrink-0 group cursor-pointer shadow-xs">
          <input
            type="color"
            value={normalized || '#3F5A47'}
            onChange={handlePickerChange}
            className="absolute -inset-2 w-10 h-10 cursor-pointer opacity-0"
            title="Pick colour"
          />
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: normalized || '#3F5A47' }}
          >
            <Pipette className="w-3 h-3 text-white drop-shadow" />
          </div>
        </div>

        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          placeholder="#HEX"
          maxLength={7}
          className="flex-1 bg-[#fafafa] border border-zinc-300 rounded-xs px-2 py-1 text-xs text-zinc-900 font-mono uppercase focus:outline-none focus:border-black"
        />

        <button
          type="submit"
          disabled={!isValid}
          className="px-2.5 py-1 bg-black text-white text-[11px] uppercase tracking-wider rounded-xs hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
        >
          Add
        </button>
      </div>

      {colorProps && (
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
          <span>{colorProps.descriptiveName}</span>
          <span>{colorProps.temperature}</span>
        </div>
      )}
    </form>
  );
};
