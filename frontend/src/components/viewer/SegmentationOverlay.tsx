'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SegmentationRegion {
  id: string;
  name: string;
  color: string;
  path: string; // SVG path data
  diceScore?: number;
  volume?: string;
  visible?: boolean;
}

interface SegmentationOverlayProps {
  regions: SegmentationRegion[];
  mode?: 'filled' | 'contour' | 'both';
  opacity?: number;
  visible?: boolean;
  selectedRegion?: string;
  onRegionClick?: (region: SegmentationRegion) => void;
  onRegionHover?: (region: SegmentationRegion | null) => void;
}

// Pre-defined anatomical region paths (simplified SVG paths for demo)
export const anatomicalPaths = {
  leftLung: 'M 15 25 Q 10 35 12 50 Q 14 65 20 72 Q 25 78 35 75 Q 40 70 42 60 Q 45 45 40 30 Q 35 20 25 18 Q 18 18 15 25 Z',
  rightLung: 'M 85 25 Q 90 35 88 50 Q 86 65 80 72 Q 75 78 65 75 Q 60 70 58 60 Q 55 45 60 30 Q 65 20 75 18 Q 82 18 85 25 Z',
  heart: 'M 50 40 Q 40 35 38 45 Q 36 55 42 62 Q 48 70 50 72 Q 52 70 58 62 Q 64 55 62 45 Q 60 35 50 40 Z',
  nodule: 'M 72 28 Q 75 26 78 28 Q 80 30 80 33 Q 80 36 78 38 Q 75 40 72 38 Q 70 36 70 33 Q 70 30 72 28 Z',
  liver: 'M 30 55 Q 25 60 28 70 Q 35 78 50 80 Q 65 78 70 70 Q 72 60 68 55 Q 60 50 45 50 Q 35 50 30 55 Z',
  kidney: 'M 25 50 Q 22 55 23 62 Q 25 68 30 70 Q 35 68 37 62 Q 38 55 35 50 Q 30 48 25 50 Z',
  spleen: 'M 75 48 Q 80 52 78 60 Q 75 66 70 65 Q 66 62 68 55 Q 70 50 75 48 Z',
  brain: 'M 50 15 Q 30 18 25 35 Q 22 50 28 65 Q 35 78 50 80 Q 65 78 72 65 Q 78 50 75 35 Q 70 18 50 15 Z',
};

// Generate mock regions based on modality
export function generateMockRegions(modality: string): SegmentationRegion[] {
  switch (modality.toUpperCase()) {
    case 'CT':
      return [
        { id: 'left-lung', name: 'Left Lung', color: '#3b82f6', path: anatomicalPaths.leftLung, diceScore: 0.94, volume: '2.4L', visible: true },
        { id: 'right-lung', name: 'Right Lung', color: '#60a5fa', path: anatomicalPaths.rightLung, diceScore: 0.92, volume: '2.8L', visible: true },
        { id: 'heart', name: 'Heart', color: '#ef4444', path: anatomicalPaths.heart, diceScore: 0.89, volume: '350mL', visible: true },
        { id: 'nodule', name: 'RUL Nodule', color: '#fbbf24', path: anatomicalPaths.nodule, diceScore: 0.97, volume: '1.4cc', visible: true },
      ];
    case 'MRI':
      return [
        { id: 'brain', name: 'Brain Parenchyma', color: '#f472b6', path: anatomicalPaths.brain, diceScore: 0.96, volume: '1400cc', visible: true },
        { id: 'lesion-1', name: 'WM Lesion 1', color: '#fbbf24', path: 'M 35 30 Q 38 28 41 30 Q 43 33 41 36 Q 38 38 35 36 Q 33 33 35 30 Z', diceScore: 0.91, volume: '0.3cc', visible: true },
        { id: 'lesion-2', name: 'WM Lesion 2', color: '#fb923c', path: 'M 60 35 Q 63 33 66 35 Q 68 38 66 41 Q 63 43 60 41 Q 58 38 60 35 Z', diceScore: 0.88, volume: '0.2cc', visible: true },
      ];
    case 'ULTRASOUND':
    case 'US':
      return [
        { id: 'liver', name: 'Liver', color: '#a855f7', path: anatomicalPaths.liver, diceScore: 0.85, volume: '15.4cm span', visible: true },
        { id: 'kidney-r', name: 'Right Kidney', color: '#14b8a6', path: anatomicalPaths.kidney, diceScore: 0.82, volume: '10.2cm', visible: true },
      ];
    case 'XRAY':
    case 'X-RAY':
      return [
        { id: 'left-lung', name: 'Left Lung Field', color: '#3b82f6', path: anatomicalPaths.leftLung, diceScore: 0.90, visible: true },
        { id: 'right-lung', name: 'Right Lung Field', color: '#60a5fa', path: anatomicalPaths.rightLung, diceScore: 0.88, visible: true },
        { id: 'heart', name: 'Cardiac Silhouette', color: '#ef4444', path: anatomicalPaths.heart, diceScore: 0.91, visible: true },
      ];
    default:
      return [];
  }
}

export default function SegmentationOverlay({
  regions,
  mode = 'both',
  opacity = 0.5,
  visible = true,
  selectedRegion,
  onRegionClick,
  onRegionHover,
}: SegmentationOverlayProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  if (!visible || regions.length === 0) return null;

  const handleHover = (region: SegmentationRegion | null) => {
    setHoveredRegion(region?.id || null);
    onRegionHover?.(region);
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          {/* Glow filter for selected regions */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <AnimatePresence>
          {regions.filter(r => r.visible !== false).map((region) => {
            const isSelected = selectedRegion === region.id;
            const isHovered = hoveredRegion === region.id;
            const showFill = mode === 'filled' || mode === 'both';
            const showContour = mode === 'contour' || mode === 'both';

            return (
              <motion.g
                key={region.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Filled region */}
                {showFill && (
                  <motion.path
                    d={region.path}
                    fill={region.color}
                    fillOpacity={isHovered || isSelected ? opacity * 1.5 : opacity}
                    className="pointer-events-auto cursor-pointer transition-all duration-200"
                    filter={isSelected ? 'url(#glow)' : undefined}
                    onClick={() => onRegionClick?.(region)}
                    onMouseEnter={() => handleHover(region)}
                    onMouseLeave={() => handleHover(null)}
                    animate={{
                      fillOpacity: isHovered || isSelected ? opacity * 1.5 : opacity,
                    }}
                  />
                )}

                {/* Contour */}
                {showContour && (
                  <motion.path
                    d={region.path}
                    fill="none"
                    stroke={region.color}
                    strokeWidth={isHovered || isSelected ? '1' : '0.5'}
                    strokeDasharray={isSelected ? 'none' : '2 1'}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => onRegionClick?.(region)}
                    onMouseEnter={() => handleHover(region)}
                    onMouseLeave={() => handleHover(null)}
                  />
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Region Labels */}
      <div className="absolute inset-0 pointer-events-none">
        {regions.filter(r => r.visible !== false).map((region) => {
          const isHovered = hoveredRegion === region.id;
          const isSelected = selectedRegion === region.id;
          
          // Calculate approximate center of path (simplified)
          const pathMatch = region.path.match(/M\s*([\d.]+)\s*([\d.]+)/);
          const centerX = pathMatch ? parseFloat(pathMatch[1]) + 10 : 50;
          const centerY = pathMatch ? parseFloat(pathMatch[2]) - 5 : 50;

          if (!isHovered && !isSelected) return null;

          return (
            <motion.div
              key={`label-${region.id}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-10"
              style={{
                left: `${centerX}%`,
                top: `${centerY}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div 
                className="bg-black/90 text-white text-[10px] px-2 py-1.5 rounded-lg whitespace-nowrap backdrop-blur-sm border"
                style={{ borderColor: region.color }}
              >
                <div className="font-bold" style={{ color: region.color }}>{region.name}</div>
                <div className="flex items-center gap-2 mt-0.5 text-slate-300">
                  {region.diceScore && <span>Dice: {(region.diceScore * 100).toFixed(0)}%</span>}
                  {region.volume && <span>• {region.volume}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* AI Badge */}
      <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-lg">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        AI Segmentation
      </div>
    </div>
  );
}
