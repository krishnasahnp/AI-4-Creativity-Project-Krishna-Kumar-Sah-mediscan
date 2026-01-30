'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Layers,
  Square,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Settings2,
  Download,
  Ruler
} from 'lucide-react';

interface OverlayControlsProps {
  heatmapVisible: boolean;
  segmentationVisible: boolean;
  annotationsVisible: boolean;
  measurementsVisible: boolean;
  onToggleHeatmap: () => void;
  onToggleSegmentation: () => void;
  onToggleAnnotations: () => void;
  onToggleMeasurements: () => void;
  heatmapOpacity: number;
  segmentationOpacity: number;
  onHeatmapOpacityChange: (value: number) => void;
  onSegmentationOpacityChange: (value: number) => void;
  segmentationMode: 'filled' | 'contour' | 'both';
  onSegmentationModeChange: (mode: 'filled' | 'contour' | 'both') => void;
  colorScheme: 'heat' | 'viridis' | 'coolwarm';
  onColorSchemeChange: (scheme: 'heat' | 'viridis' | 'coolwarm') => void;
  onExportAnnotated?: () => void;
}

export default function OverlayControls({
  heatmapVisible,
  segmentationVisible,
  annotationsVisible,
  measurementsVisible,
  onToggleHeatmap,
  onToggleSegmentation,
  onToggleAnnotations,
  onToggleMeasurements,
  heatmapOpacity,
  segmentationOpacity,
  onHeatmapOpacityChange,
  onSegmentationOpacityChange,
  segmentationMode,
  onSegmentationModeChange,
  colorScheme,
  onColorSchemeChange,
  onExportAnnotated,
}: OverlayControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleButtons = [
    {
      id: 'heatmap',
      label: 'Heatmap',
      icon: Flame,
      active: heatmapVisible,
      onToggle: onToggleHeatmap,
      color: 'from-red-500 to-orange-400'
    },
    {
      id: 'segmentation',
      label: 'Segmentation',
      icon: Layers,
      active: segmentationVisible,
      onToggle: onToggleSegmentation,
      color: 'from-blue-500 to-cyan-400'
    },
    {
      id: 'annotations',
      label: 'Boxes',
      icon: Square,
      active: annotationsVisible,
      onToggle: onToggleAnnotations,
      color: 'from-purple-500 to-pink-400'
    },
    {
      id: 'measurements',
      label: 'Measurements',
      icon: Ruler,
      active: measurementsVisible,
      onToggle: onToggleMeasurements,
      color: 'from-cyan-500 to-teal-400'
    }
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">AI Overlays</p>
            <p className="text-[10px] text-slate-400">Visual Analysis Tools</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700"
          >
            {/* Main Toggle Buttons */}
            <div className="p-3 grid grid-cols-2 gap-2">
              {toggleButtons.map((btn) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.id}
                    onClick={btn.onToggle}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      btn.active
                        ? `bg-gradient-to-r ${btn.color} text-white shadow-lg`
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{btn.label}</span>
                    {btn.active ? (
                      <Eye className="w-3 h-3 ml-auto opacity-70" />
                    ) : (
                      <EyeOff className="w-3 h-3 ml-auto opacity-50" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="px-3 pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!heatmapVisible) onToggleHeatmap();
                    if (!annotationsVisible) onToggleAnnotations();
                    if (segmentationVisible) onToggleSegmentation();
                  }}
                  className="flex-1 text-[10px] py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Focus Mode
                </button>
                <button
                  onClick={() => {
                    if (!heatmapVisible) onToggleHeatmap();
                    if (!segmentationVisible) onToggleSegmentation();
                    if (!annotationsVisible) onToggleAnnotations();
                    if (!measurementsVisible) onToggleMeasurements();
                  }}
                  className="flex-1 text-[10px] py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Show All
                </button>
                <button
                  onClick={() => {
                    if (heatmapVisible) onToggleHeatmap();
                    if (segmentationVisible) onToggleSegmentation();
                    if (annotationsVisible) onToggleAnnotations();
                    if (measurementsVisible) onToggleMeasurements();
                  }}
                  className="flex-1 text-[10px] py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Hide All
                </button>
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-3 py-2 border-t border-slate-700 hover:bg-slate-800/50 transition-colors"
            >
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <Settings2 className="w-3 h-3" />
                Advanced Settings
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-3 h-3 text-slate-500" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-500" />
              )}
            </button>

            {/* Advanced Settings Panel */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 pb-3 space-y-4"
                >
                  {/* Heatmap Opacity */}
                  <div>
                    <label className="text-[10px] text-slate-400 mb-1.5 block">
                      Heatmap Opacity: {Math.round(heatmapOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={heatmapOpacity * 100}
                      onChange={(e) => onHeatmapOpacityChange(parseInt(e.target.value) / 100)}
                      className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>

                  {/* Segmentation Opacity */}
                  <div>
                    <label className="text-[10px] text-slate-400 mb-1.5 block">
                      Segmentation Opacity: {Math.round(segmentationOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={segmentationOpacity * 100}
                      onChange={(e) => onSegmentationOpacityChange(parseInt(e.target.value) / 100)}
                      className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Segmentation Mode */}
                  <div>
                    <label className="text-[10px] text-slate-400 mb-1.5 block">Segmentation Mode</label>
                    <div className="flex gap-1">
                      {(['filled', 'contour', 'both'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => onSegmentationModeChange(mode)}
                          className={`flex-1 text-[10px] py-1.5 rounded-lg transition-colors ${
                            segmentationMode === mode
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Scheme */}
                  <div>
                    <label className="text-[10px] text-slate-400 mb-1.5 block">Heatmap Color</label>
                    <div className="flex gap-1">
                      {([
                        { id: 'heat', gradient: 'from-red-500 to-yellow-400', label: 'Heat' },
                        { id: 'viridis', gradient: 'from-purple-600 to-green-400', label: 'Viridis' },
                        { id: 'coolwarm', gradient: 'from-blue-500 to-red-500', label: 'Cool-Warm' },
                      ] as const).map((scheme) => (
                        <button
                          key={scheme.id}
                          onClick={() => onColorSchemeChange(scheme.id)}
                          className={`flex-1 text-[10px] py-1.5 rounded-lg transition-all ${
                            colorScheme === scheme.id
                              ? `bg-gradient-to-r ${scheme.gradient} text-white shadow-lg`
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {scheme.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Export Button */}
            {onExportAnnotated && (
              <div className="p-3 border-t border-slate-700">
                <button
                  onClick={onExportAnnotated}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white text-xs font-semibold hover:from-teal-500 hover:to-cyan-400 transition-all shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Export Annotated Image
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
