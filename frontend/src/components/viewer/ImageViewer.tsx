'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Ruler,
  Crosshair,
  Layers,
  Grid3X3,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Download,
  Settings,
} from 'lucide-react';
import clsx from 'clsx';

interface ImageViewerProps {
  imageUrl?: string;
  totalSlices?: number;
  currentSlice?: number;
  onSliceChange?: (slice: number) => void;
  overlayData?: {
    heatmap?: string;
    segmentation?: string;
    annotations?: Array<{
      type: 'marker' | 'ruler' | 'box';
      coords: number[];
      label?: string;
    }>;
  };
  metadata?: {
    modality: string;
    bodyPart: string;
    windowPreset: string;
  };
}

const windowPresets = [
  { name: 'Lung', center: -600, width: 1500 },
  { name: 'Mediastinum', center: 40, width: 400 },
  { name: 'Bone', center: 400, width: 1800 },
  { name: 'Brain', center: 40, width: 80 },
  { name: 'Soft Tissue', center: 40, width: 350 },
];

export default function ImageViewer({
  imageUrl = '/placeholder-ct.png',
  totalSlices = 100,
  currentSlice = 50,
  onSliceChange,
  overlayData,
  metadata,
}: ImageViewerProps) {
  const [slice, setSlice] = useState(currentSlice);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSegmentation, setShowSegmentation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState('Lung');
  const [tool, setTool] = useState<'pan' | 'zoom' | 'ruler' | 'marker'>('pan');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setSlice((s) => Math.min(totalSlices, s + 1));
          break;
        case 'ArrowDown':
          setSlice((s) => Math.max(1, s - 1));
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(4, z * 1.2));
          break;
        case '-':
          setZoom((z) => Math.max(0.25, z / 1.2));
          break;
        case 'r':
          handleReset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlices]);

  // Auto-play slices
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setSlice((s) => (s >= totalSlices ? 1 : s + 1));
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, totalSlices]);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(4, Math.max(0.25, z * delta)));
    } else {
      const delta = e.deltaY > 0 ? -1 : 1;
      setSlice((s) => Math.min(totalSlices, Math.max(1, s + delta)));
    }
  }, [totalSlices]);

  return (
    <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        {/* Left Tools */}
        <div className="flex items-center gap-1">
          <ToolButton icon={ZoomIn} label="Zoom In" onClick={() => setZoom(z => Math.min(4, z * 1.2))} />
          <ToolButton icon={ZoomOut} label="Zoom Out" onClick={() => setZoom(z => Math.max(0.25, z / 1.2))} />
          <ToolButton icon={RotateCcw} label="Reset" onClick={handleReset} />
          <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
          <ToolButton 
            icon={Crosshair} 
            label="Pan" 
            active={tool === 'pan'}
            onClick={() => setTool('pan')} 
          />
          <ToolButton 
            icon={Ruler} 
            label="Measure" 
            active={tool === 'ruler'}
            onClick={() => setTool('ruler')} 
          />
        </div>

        {/* Center - Slice Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSlice(s => Math.max(1, s - 1))}
            className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-mono min-w-[80px] text-center">
            {slice} / {totalSlices}
          </span>
          <button
            onClick={() => setSlice(s => Math.min(totalSlices, s + 1))}
            className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={clsx(
              'p-1.5 rounded',
              isPlaying ? 'bg-[var(--color-accent-primary)] text-white' : 'hover:bg-[var(--color-bg-tertiary)]'
            )}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1">
          <ToolButton 
            icon={Layers} 
            label="Segmentation" 
            active={showSegmentation}
            onClick={() => setShowSegmentation(!showSegmentation)} 
          />
          <ToolButton 
            icon={Grid3X3} 
            label="Heatmap" 
            active={showHeatmap}
            onClick={() => setShowHeatmap(!showHeatmap)} 
          />
          <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
          <ToolButton icon={Maximize2} label="Fullscreen" />
          <ToolButton icon={Download} label="Export" />
        </div>
      </div>

      {/* Window Presets */}
      <div className="flex items-center gap-1 p-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-text-muted)] mr-2">Window:</span>
        {windowPresets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setSelectedWindow(preset.name)}
            className={clsx(
              'px-2 py-1 text-xs rounded transition-colors',
              selectedWindow === preset.name
                ? 'bg-[var(--color-accent-primary)] text-white'
                : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
            )}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Image Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-move"
        onWheel={handleWheel}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            scale: zoom,
            x: pan.x,
            y: pan.y,
          }}
        >
          {/* Placeholder Image */}
          <div className="w-[512px] h-[512px] bg-gray-900 rounded relative">
            {/* Simulated CT slice */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[400px] h-[400px] rounded-full bg-gradient-radial from-gray-600 via-gray-700 to-gray-800 relative">
                {/* Simulated anatomy */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-20 bg-gray-500/50 rounded-full" />
                <div className="absolute top-1/3 left-1/4 w-16 h-24 bg-gray-500/30 rounded-full rotate-12" />
                <div className="absolute top-1/3 right-1/4 w-16 h-24 bg-gray-500/30 rounded-full -rotate-12" />
                
                {/* Simulated finding */}
                <div className="absolute top-[40%] right-[30%] w-4 h-4 bg-white/80 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Heatmap Overlay */}
            {showHeatmap && (
              <div className="absolute inset-0 pointer-events-none">
                <div 
                  className="absolute top-[35%] right-[25%] w-20 h-20 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,0,0,0.6) 0%, rgba(255,165,0,0.3) 50%, transparent 70%)',
                  }}
                />
              </div>
            )}

            {/* Segmentation Overlay */}
            {showSegmentation && (
              <div className="absolute inset-0 pointer-events-none">
                <div 
                  className="absolute top-[38%] right-[28%] w-6 h-6 border-2 border-green-400 rounded-full"
                  style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/50 rounded text-xs text-white">
          {Math.round(zoom * 100)}%
        </div>

        {/* Metadata overlay */}
        <div className="absolute top-4 left-4 text-xs text-white/70 space-y-1">
          <p>Modality: {metadata?.modality || 'CT'}</p>
          <p>Body Part: {metadata?.bodyPart || 'Chest'}</p>
          <p>WL/WW: {windowPresets.find(p => p.name === selectedWindow)?.center} / {windowPresets.find(p => p.name === selectedWindow)?.width}</p>
        </div>
      </div>

      {/* Slice Slider */}
      <div className="p-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
        <input
          type="range"
          min={1}
          max={totalSlices}
          value={slice}
          onChange={(e) => setSlice(Number(e.target.value))}
          className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-primary)]"
        />
      </div>
    </div>
  );
}

interface ToolButtonProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

function ToolButton({ icon: Icon, label, onClick, active }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'p-2 rounded transition-colors relative group',
        active
          ? 'bg-[var(--color-accent-primary)] text-white'
          : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--color-bg-tertiary)] rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        {label}
      </span>
    </button>
  );
}
