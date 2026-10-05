import React, { useState } from 'react';
import { useOutfit } from './hooks/useOutfit';
import { Header } from './components/UI/Header';
import { StudioCanvas, CameraPreset } from './components/Studio/StudioCanvas';
import { ClothingSelector } from './components/Outfit/ClothingSelector';
import { ScoreDisplay } from './components/Evaluation/ScoreDisplay';
import { OutfitSummary } from './components/Outfit/OutfitSummary';

export default function App() {
  const {
    shirtColor,
    trousersColor,
    shoesColor,
    customColors,
    evaluation,
    activeCategory,
    setActiveCategory,
    selectColor,
    addCustomColor,
    clearCategory,
    clearAll,
    applyRecommendation,
    resetOutfit,
  } = useOutfit();

  const [activePreset, setActivePreset] = useState<CameraPreset>('full');

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111111] flex flex-col font-sans antialiased selection:bg-zinc-200">
      {/* 1. Clean Top Header from screenshot */}
      <Header onReset={resetOutfit} onClearAll={clearAll} />

      {/* 2. Main Studio Body: 3D Stage on Left, Clean Sidebar on Right */}
      <main className="flex-1 w-full flex flex-col md:flex-row items-stretch overflow-hidden">
        {/* Left Column: 3D Viewport with screenshot overlays */}
        <div className="flex-1 min-h-[460px] md:min-h-[calc(100vh-64px)] relative">
          <StudioCanvas
            shirtColor={shirtColor}
            trousersColor={trousersColor}
            shoesColor={shoesColor}
            activeCategory={activeCategory}
            onActiveCategoryChange={setActiveCategory}
            externalPreset={activePreset}
            onPresetChange={setActivePreset}
          />
        </div>

        {/* Right Column: Clean Minimalist Sidebar from screenshot */}
        <aside className="w-full md:w-[360px] lg:w-[400px] xl:w-[430px] shrink-0 border-t md:border-t-0 md:border-l border-[#eaeaea] bg-[#fafafa] flex flex-col justify-between p-5 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-64px)] custom-scroll">
          <div className="space-y-6">
            {/* [ CLOTHING ] & [ COLOUR ] Sections */}
            <ClothingSelector
              shirtColor={shirtColor}
              trousersColor={trousersColor}
              shoesColor={shoesColor}
              customColors={customColors}
              onSelectColor={selectColor}
              onAddCustomColor={addCustomColor}
              onClearCategory={clearCategory}
              activeCategory={activeCategory}
              onActiveCategoryChange={setActiveCategory}
            />

            {/* [ COMPATIBILITY ] Section */}
            <ScoreDisplay
              evaluation={evaluation}
              onApplyRecommendation={applyRecommendation}
            />

            {/* [ OUTFIT ] Summary Section */}
            <OutfitSummary
              shirtColor={shirtColor}
              trousersColor={trousersColor}
              shoesColor={shoesColor}
            />
          </div>

          {/* Bottom Guide Prompt from screenshot */}
          <div className="pt-4 border-t border-[#eaeaea] flex items-center justify-between text-xs text-zinc-500 font-sans">
            <span>
              {evaluation.selectedCount === 0
                ? 'Start by selecting a colour for your shirt or trousers.'
                : evaluation.selectedCount === 1
                ? 'Choose another colour to calculate compatibility.'
                : `${evaluation.selectedCount} of 3 colours selected.`}
            </span>

            <button
              type="button"
              onClick={resetOutfit}
              className="text-[11px] font-mono text-zinc-400 hover:text-black transition-colors cursor-pointer shrink-0 ml-2"
              title="Reset to classic menswear baseline"
            >
              [ Reset ]
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
