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
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Download,
  Flame,
  Square,
  Eye,
  EyeOff,
} from 'lucide-react';
import clsx from 'clsx';
import HeatmapOverlay, { Hotspot } from './HeatmapOverlay';
import SegmentationOverlay, { SegmentationRegion, generateMockRegions } from './SegmentationOverlay';
import AnnotationOverlay, { BoundingBox, MeasurementLine, generateMockAnnotations } from './AnnotationOverlay';

interface EnhancedImageViewerProps {
  imageUrl?: string;
  totalSlices?: number;
  currentSlice?: number;
  onSliceChange?: (slice: number) => void;
  modality?: string;
  bodyPart?: string;
  showAIOverlays?: boolean;
}

const windowPresets = [
  { name: 'Lung', center: -600, width: 1500 },
  { name: 'Mediastinum', center: 40, width: 400 },
  { name: 'Bone', center: 400, width: 1800 },
  { name: 'Brain', center: 40, width: 80 },
  { name: 'Soft Tissue', center: 40, width: 350 },
];

// Generate mock heatmap hotspots based on modality
function generateMockHotspots(modality: string): Hotspot[] {
  switch (modality.toUpperCase()) {
    case 'CT':
      return [
        { x: 72, y: 28, radius: 8, intensity: 0.94, label: 'RUL Nodule', finding: 'Pulmonary Nodule' },
        { x: 48, y: 48, radius: 5, intensity: 0.78, label: 'Station 7', finding: 'Lymph Node' },
        { x: 25, y: 65, radius: 4, intensity: 0.45, label: 'GGO', finding: 'Ground-Glass Opacity' },
      ];
    case 'MRI':
      return [
        { x: 35, y: 32, radius: 6, intensity: 0.89, label: 'WM Lesion', finding: 'White Matter Hyperintensity' },
        { x: 62, y: 38, radius: 5, intensity: 0.85, label: 'Subcortical', finding: 'Subcortical Lesion' },
        { x: 50, y: 55, radius: 4, intensity: 0.72, label: 'Callosal', finding: 'Corpus Callosum' },
      ];
    case 'XRAY':
    case 'X-RAY':
      return [
        { x: 62, y: 65, radius: 10, intensity: 0.97, label: 'Fracture', finding: 'Distal Radius Fracture' },
        { x: 55, y: 58, radius: 12, intensity: 0.82, label: 'Swelling', finding: 'Soft Tissue' },
      ];
    case 'ULTRASOUND':
    case 'US':
      return [
        { x: 45, y: 50, radius: 15, intensity: 0.86, label: 'Steatosis', finding: 'Hepatic Steatosis' },
      ];
    default:
      return [];
  }
}

export default function EnhancedImageViewer({
  imageUrl,
  totalSlices = 100,
  currentSlice = 50,
  onSliceChange,
  modality = 'CT',
  bodyPart = 'Chest',
  showAIOverlays = true,
}: EnhancedImageViewerProps) {
  const [slice, setSlice] = useState(currentSlice);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState('Lung');
  const [tool, setTool] = useState<'pan' | 'zoom' | 'ruler' | 'marker'>('pan');
  
  // AI Overlay States
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showSegmentation, setShowSegmentation] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7);
  const [segmentationOpacity, setSegmentationOpacity] = useState(0.4);
  const [segmentationMode, setSegmentationMode] = useState<'filled' | 'contour' | 'both'>('both');
  const [colorScheme, setColorScheme] = useState<'heat' | 'viridis' | 'coolwarm'>('heat');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate overlay data based on modality
  const hotspots = generateMockHotspots(modality);
  const regions = generateMockRegions(modality);
  const { boxes, measurements } = generateMockAnnotations(modality);

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
        case 'h':
          setShowHeatmap(v => !v);
          break;
        case 's':
          setShowSegmentation(v => !v);
          break;
        case 'a':
          setShowAnnotations(v => !v);
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

  const handleExportAnnotated = () => {
    // In production, this would use html2canvas or similar
    alert('Export functionality would save annotated image as PNG');
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-xl overflow-hidden border border-slate-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-slate-700">
        {/* Left Tools */}
        <div className="flex items-center gap-1">
          <ToolButton icon={ZoomIn} label="Zoom In" onClick={() => setZoom(z => Math.min(4, z * 1.2))} />
          <ToolButton icon={ZoomOut} label="Zoom Out" onClick={() => setZoom(z => Math.max(0.25, z / 1.2))} />
          <ToolButton icon={RotateCcw} label="Reset" onClick={handleReset} />
          <div className="w-px h-6 bg-slate-700 mx-1" />
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
            className="p-1 hover:bg-slate-700 rounded text-slate-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-mono min-w-[80px] text-center text-white">
            {slice} / {totalSlices}
          </span>
          <button
            onClick={() => setSlice(s => Math.min(totalSlices, s + 1))}
            className="p-1 hover:bg-slate-700 rounded text-slate-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={clsx(
              'p-1.5 rounded',
              isPlaying ? 'bg-teal-600 text-white' : 'hover:bg-slate-700 text-slate-400'
            )}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Tools - AI Overlays */}
        <div className="flex items-center gap-1">
          <ToolButton 
            icon={Flame} 
            label="AI Heatmap (H)" 
            active={showHeatmap}
            onClick={() => setShowHeatmap(!showHeatmap)}
            color="orange"
          />
          <ToolButton 
            icon={Layers} 
            label="Segmentation (S)" 
            active={showSegmentation}
            onClick={() => setShowSegmentation(!showSegmentation)}
            color="blue"
          />
          <ToolButton 
            icon={Square} 
            label="Annotations (A)" 
            active={showAnnotations}
            onClick={() => setShowAnnotations(!showAnnotations)}
            color="purple"
          />
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <ToolButton icon={Maximize2} label="Fullscreen" />
          <ToolButton icon={Download} label="Export" onClick={handleExportAnnotated} />
        </div>
      </div>

      {/* Window Presets */}
      <div className="flex items-center gap-1 p-2 bg-slate-900/50 border-b border-slate-700">
        <span className="text-xs text-slate-500 mr-2">Window:</span>
        {windowPresets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setSelectedWindow(preset.name)}
            className={clsx(
              'px-2 py-1 text-xs rounded transition-colors',
              selectedWindow === preset.name
                ? 'bg-teal-600 text-white'
                : 'hover:bg-slate-700 text-slate-400'
            )}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Image Canvas with Overlays */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-move bg-black"
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
          {/* Image Container */}
          <div className="w-[512px] h-[512px] bg-gray-900 rounded relative">
            {/* Simulated CT/MRI/X-Ray slice */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[400px] h-[400px] rounded-full bg-gradient-radial from-gray-600 via-gray-700 to-gray-800 relative">
                {/* Simulated anatomy based on modality */}
                {modality === 'CT' && (
                  <>
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-20 bg-gray-500/50 rounded-full" />
                    <div className="absolute top-1/3 left-1/4 w-16 h-24 bg-gray-500/30 rounded-full rotate-12" />
                    <div className="absolute top-1/3 right-1/4 w-16 h-24 bg-gray-500/30 rounded-full -rotate-12" />
                    <div className="absolute top-[40%] right-[30%] w-4 h-4 bg-white/80 rounded-full animate-pulse" />
                  </>
                )}
                {modality === 'MRI' && (
                  <>
                    <div className="absolute inset-8 rounded-full bg-gradient-radial from-gray-400 to-gray-600" />
                    <div className="absolute top-[30%] left-[35%] w-3 h-3 bg-white/90 rounded-full" />
                    <div className="absolute top-[35%] right-[35%] w-2.5 h-2.5 bg-white/80 rounded-full" />
                  </>
                )}
                {(modality === 'XRAY' || modality === 'X-RAY') && (
                  <>
                    <div className="absolute top-[55%] left-1/2 -translate-x-1/2 w-48 h-20 bg-gray-400/40 rounded-lg -rotate-6" />
                    <div className="absolute top-[60%] left-[55%] w-1 h-16 bg-white/60 rotate-12" />
                  </>
                )}
              </div>
            </div>

            {/* AI Overlay Layers */}
            {showAIOverlays && (
              <>
                {/* Heatmap Overlay */}
                <HeatmapOverlay
                  hotspots={hotspots}
                  colorScheme={colorScheme}
                  opacity={heatmapOpacity}
                  visible={showHeatmap}
                  showLabels={true}
                  onHotspotClick={(h) => console.log('Clicked hotspot:', h)}
                />

                {/* Segmentation Overlay */}
                <SegmentationOverlay
                  regions={regions}
                  mode={segmentationMode}
                  opacity={segmentationOpacity}
                  visible={showSegmentation}
                  selectedRegion={selectedRegion || undefined}
                  onRegionClick={(r) => setSelectedRegion(r.id)}
                />

                {/* Annotation Overlay */}
                <AnnotationOverlay
                  boxes={boxes}
                  measurements={measurements}
                  visible={showAnnotations}
                  showLabels={true}
                  showMeasurements={showMeasurements}
                  selectedBox={selectedBox || undefined}
                  onBoxClick={(b) => setSelectedBox(b.id)}
                />
              </>
            )}
          </div>
        </motion.div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/70 rounded text-xs text-white font-mono">
          {Math.round(zoom * 100)}%
        </div>

        {/* Metadata overlay */}
        <div className="absolute top-4 left-4 text-xs text-white/80 space-y-1 bg-black/50 p-2 rounded-lg">
          <p><span className="text-slate-400">Modality:</span> {modality}</p>
          <p><span className="text-slate-400">Body Part:</span> {bodyPart}</p>
          <p><span className="text-slate-400">WL/WW:</span> {windowPresets.find(p => p.name === selectedWindow)?.center} / {windowPresets.find(p => p.name === selectedWindow)?.width}</p>
          <p><span className="text-slate-400">Slice:</span> {slice} of {totalSlices}</p>
        </div>

        {/* AI Active Indicator */}
        {showAIOverlays && (showHeatmap || showSegmentation || showAnnotations) && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-to-r from-purple-600/80 to-blue-600/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI Analysis Active
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 bg-black/50 p-2 rounded-lg space-y-0.5">
          <p>↑↓ Scroll slices • +/- Zoom • R Reset</p>
          <p>H Heatmap • S Segment • A Annotations</p>
        </div>
      </div>

      {/* Slice Slider */}
      <div className="p-3 bg-slate-900 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-12">Slice</span>
          <input
            type="range"
            min={1}
            max={totalSlices}
            value={slice}
            onChange={(e) => setSlice(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <span className="text-xs text-slate-400 w-16 text-right font-mono">{slice}/{totalSlices}</span>
        </div>
      </div>
    </div>
  );
}

interface ToolButtonProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  color?: 'default' | 'orange' | 'blue' | 'purple';
}

function ToolButton({ icon: Icon, label, onClick, active, color = 'default' }: ToolButtonProps) {
  const colors = {
    default: active ? 'bg-teal-600 text-white' : 'hover:bg-slate-700 text-slate-400',
    orange: active ? 'bg-gradient-to-r from-red-500 to-orange-400 text-white' : 'hover:bg-slate-700 text-slate-400',
    blue: active ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white' : 'hover:bg-slate-700 text-slate-400',
    purple: active ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white' : 'hover:bg-slate-700 text-slate-400',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'p-2 rounded transition-all relative group',
        colors[color]
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-white">
        {label}
      </span>
    </button>
  );
}
