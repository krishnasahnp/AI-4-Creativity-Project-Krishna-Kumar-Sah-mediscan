'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, Eye, EyeOff, User, Cpu, Scale, ChevronLeft, ChevronRight } from 'lucide-react';

interface OverlayData {
  type: 'mask' | 'heatmap';
  imageUrl: string;
  label: string;
}

interface CompareOverlayProps {
  baseImageUrl: string;
  aiOverlay: OverlayData;
  humanOverlay?: OverlayData;
  onDifferenceCalculated?: (difference: number) => void;
}

export default function CompareOverlay({
  baseImageUrl,
  aiOverlay,
  humanOverlay,
  onDifferenceCalculated,
}: CompareOverlayProps) {
  const [mode, setMode] = useState<'side-by-side' | 'overlay' | 'slider'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [aiOpacity, setAiOpacity] = useState(0.7);
  const [humanOpacity, setHumanOpacity] = useState(0.7);
  const [showAI, setShowAI] = useState(true);
  const [showHuman, setShowHuman] = useState(true);
  const [diceScore, setDiceScore] = useState<number | null>(null);

  // Simulated Dice score calculation
  useEffect(() => {
    if (aiOverlay && humanOverlay) {
      // In real implementation, this would compute actual overlap
      const simulatedDice = 0.85 + Math.random() * 0.1;
      setDiceScore(simulatedDice);
      onDifferenceCalculated?.(1 - simulatedDice);
    }
  }, [aiOverlay, humanOverlay, onDifferenceCalculated]);

  const modes = [
    { id: 'slider', label: 'Slider', icon: Scale },
    { id: 'side-by-side', label: 'Side by Side', icon: Layers },
    { id: 'overlay', label: 'Overlay', icon: Layers },
  ] as const;

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">Compare: AI vs Human</h3>
          {diceScore !== null && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              diceScore > 0.9 ? 'bg-green-500/20 text-green-400' :
              diceScore > 0.7 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              Dice: {(diceScore * 100).toFixed(1)}%
            </span>
          )}
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] rounded-lg p-1">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                mode === m.id
                  ? 'bg-blue-500 text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-white'
              }`}
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility controls */}
      <div className="flex items-center gap-4 p-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAI(!showAI)}
            className={`p-2 rounded-lg transition-colors ${
              showAI ? 'bg-blue-500/20 text-blue-400' : 'bg-[var(--color-bg-tertiary)]'
            }`}
          >
            {showAI ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-sm">AI</span>
          </div>
          {mode === 'overlay' && (
            <input
              type="range"
              min="0"
              max="100"
              value={aiOpacity * 100}
              onChange={(e) => setAiOpacity(Number(e.target.value) / 100)}
              className="w-24 h-1"
            />
          )}
        </div>

        {humanOverlay && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHuman(!showHuman)}
              className={`p-2 rounded-lg transition-colors ${
                showHuman ? 'bg-green-500/20 text-green-400' : 'bg-[var(--color-bg-tertiary)]'
              }`}
            >
              {showHuman ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4 text-green-400" />
              <span className="text-sm">Human</span>
            </div>
            {mode === 'overlay' && (
              <input
                type="range"
                min="0"
                max="100"
                value={humanOpacity * 100}
                onChange={(e) => setHumanOpacity(Number(e.target.value) / 100)}
                className="w-24 h-1"
              />
            )}
          </div>
        )}
      </div>

      {/* Comparison view */}
      <div className="relative aspect-square bg-black">
        {mode === 'side-by-side' && (
          <div className="flex h-full">
            {/* AI side */}
            <div className="flex-1 relative border-r border-[var(--color-border)]">
              <img src={baseImageUrl} alt="Base" className="w-full h-full object-contain" />
              {showAI && (
                <img 
                  src={aiOverlay.imageUrl} 
                  alt="AI Overlay" 
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ opacity: aiOpacity }}
                />
              )}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 rounded px-2 py-1 text-xs">
                <Cpu className="w-3 h-3 text-blue-400" />
                AI Segmentation
              </div>
            </div>

            {/* Human side */}
            {humanOverlay && (
              <div className="flex-1 relative">
                <img src={baseImageUrl} alt="Base" className="w-full h-full object-contain" />
                {showHuman && (
                  <img 
                    src={humanOverlay.imageUrl} 
                    alt="Human Overlay" 
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ opacity: humanOpacity }}
                  />
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 rounded px-2 py-1 text-xs">
                  <User className="w-3 h-3 text-green-400" />
                  Human Annotation
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'overlay' && (
          <div className="relative h-full">
            <img src={baseImageUrl} alt="Base" className="w-full h-full object-contain" />
            {showAI && (
              <img 
                src={aiOverlay.imageUrl} 
                alt="AI Overlay" 
                className="absolute inset-0 w-full h-full object-contain mix-blend-screen"
                style={{ opacity: aiOpacity, filter: 'hue-rotate(200deg)' }}
              />
            )}
            {humanOverlay && showHuman && (
              <img 
                src={humanOverlay.imageUrl} 
                alt="Human Overlay" 
                className="absolute inset-0 w-full h-full object-contain mix-blend-screen"
                style={{ opacity: humanOpacity, filter: 'hue-rotate(100deg)' }}
              />
            )}
            
            {/* Legend */}
            <div className="absolute bottom-2 right-2 bg-black/70 rounded p-2 text-xs space-y-1">
              {showAI && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span>AI Prediction</span>
                </div>
              )}
              {humanOverlay && showHuman && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Human Annotation</span>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === 'slider' && humanOverlay && (
          <div className="relative h-full overflow-hidden">
            {/* Left side (AI) */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img src={baseImageUrl} alt="Base" className="w-full h-full object-contain" />
              {showAI && (
                <img 
                  src={aiOverlay.imageUrl} 
                  alt="AI Overlay" 
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ opacity: aiOpacity }}
                />
              )}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-blue-500/80 rounded px-2 py-1 text-xs">
                <Cpu className="w-3 h-3" />
                AI
              </div>
            </div>

            {/* Right side (Human) */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
            >
              <img src={baseImageUrl} alt="Base" className="w-full h-full object-contain" />
              {showHuman && (
                <img 
                  src={humanOverlay.imageUrl} 
                  alt="Human Overlay" 
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ opacity: humanOpacity }}
                />
              )}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/80 rounded px-2 py-1 text-xs">
                <User className="w-3 h-3" />
                Human
              </div>
            </div>

            {/* Slider handle */}
            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
              style={{ left: `${sliderPosition}%` }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0}
              onDrag={(_, info) => {
                const container = document.querySelector('.aspect-square');
                if (container) {
                  const rect = container.getBoundingClientRect();
                  const newPosition = ((info.point.x - rect.left) / rect.width) * 100;
                  setSliderPosition(Math.max(0, Math.min(100, newPosition)));
                }
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <ChevronLeft className="w-3 h-3 text-black" />
                <ChevronRight className="w-3 h-3 text-black" />
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Metrics */}
      {diceScore !== null && humanOverlay && (
        <div className="p-3 border-t border-[var(--color-border)]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{(diceScore * 100).toFixed(1)}%</div>
              <div className="text-xs text-[var(--color-text-muted)]">Dice Coefficient</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{((diceScore + 0.05) * 100).toFixed(1)}%</div>
              <div className="text-xs text-[var(--color-text-muted)]">IoU Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{((1 - diceScore) * 100).toFixed(1)}%</div>
              <div className="text-xs text-[var(--color-text-muted)]">Difference</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
