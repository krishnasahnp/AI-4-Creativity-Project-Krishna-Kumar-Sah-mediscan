'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Ruler,
  Crosshair,
  Layers,
  Flame,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Download,
  Settings,
  Square,
  X,
  SkipForward,
  SkipBack,
  FastForward,
} from 'lucide-react';
import clsx from 'clsx';

interface Measurement {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  distance: number;
}

interface FullImageViewerProps {
  imageUrl?: string;
  totalSlices?: number;
  currentSlice?: number;
  onSliceChange?: (slice: number) => void;
  modality?: string;
  bodyPart?: string;
}

const windowPresets = [
  { name: 'Lung', center: -600, width: 1500, brightness: 1.2, contrast: 1.4 },
  { name: 'Mediastinum', center: 40, width: 400, brightness: 1.0, contrast: 1.2 },
  { name: 'Bone', center: 400, width: 1800, brightness: 1.5, contrast: 1.8 },
  { name: 'Brain', center: 40, width: 80, brightness: 0.9, contrast: 1.1 },
  { name: 'Soft Tissue', center: 40, width: 350, brightness: 1.0, contrast: 1.0 },
];

// Pixel scale: 0.5mm per pixel
const PIXEL_SCALE = 0.5;

export default function FullImageViewer({
  totalSlices = 120,
  currentSlice: propSlice,
  onSliceChange,
  modality = 'CT',
  bodyPart = 'Chest',
}: FullImageViewerProps) {
  // Core state
  const [slice, setSlice] = useState(propSlice || 64);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedWindow, setSelectedWindow] = useState('Lung');
  
  // Tool state
  const [tool, setTool] = useState<'pan' | 'zoom' | 'ruler'>('pan');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Measurement state
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<Partial<Measurement> | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Overlay state
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSegmentation, setShowSegmentation] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Use internal slice state, sync only once on mount or when propSlice explicitly changes
  const isInitialMount = useRef(true);
  const lastPropSlice = useRef(propSlice);
  
  useEffect(() => {
    // Only sync from parent on explicit propSlice changes, not on every render
    if (propSlice !== undefined && propSlice !== lastPropSlice.current) {
      setSlice(propSlice);
      lastPropSlice.current = propSlice;
    }
  }, [propSlice]);

  // Debounced callback to parent to avoid rapid re-renders
  const onSliceChangeRef = useRef(onSliceChange);
  onSliceChangeRef.current = onSliceChange;
  
  useEffect(() => {
    // Skip initial mount notification
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Only notify if this was an internal change (not from prop sync)
    if (slice !== propSlice) {
      onSliceChangeRef.current?.(slice);
    }
  }, [slice, propSlice]);

  // Generate slice-based anatomy (simulates real CT)
  const sliceData = useMemo(() => {
    const normalized = slice / totalSlices;
    
    // Nodule visibility (only on slices 40-70% of stack)
    const showNodule = normalized >= 0.4 && normalized <= 0.7;
    const noduleSize = showNodule ? 4 + Math.sin((normalized - 0.4) * Math.PI / 0.3) * 8 : 0;
    const noduleOpacity = showNodule ? 0.6 + Math.sin((normalized - 0.4) * Math.PI / 0.3) * 0.4 : 0;
    
    // Lung size varies by slice (larger in middle)
    const lungScale = 0.7 + Math.sin(normalized * Math.PI) * 0.3;
    
    // Heart visibility (lower slices)
    const showHeart = normalized > 0.3 && normalized < 0.8;
    const heartSize = showHeart ? 60 + (0.5 - Math.abs(normalized - 0.55)) * 40 : 0;
    
    // Spine visibility
    const spineWidth = 20 + Math.sin(normalized * Math.PI * 2) * 5;
    
    // Random noise seed for slice variation
    const noise = Math.sin(slice * 123.456) * 0.1;
    
    return {
      showNodule,
      noduleSize,
      noduleOpacity,
      lungScale,
      showHeart,
      heartSize,
      spineWidth,
      noise,
    };
  }, [slice, totalSlices]);

  // Get current window settings
  const currentWindow = windowPresets.find(p => p.name === selectedWindow) || windowPresets[0];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSlice((s) => Math.min(totalSlices, s + 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSlice((s) => Math.max(1, s - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSlice((s) => Math.min(totalSlices, s + 5));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSlice((s) => Math.max(1, s - 5));
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
        case ' ':
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case 'f':
          toggleFullscreen();
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
        case 'm':
          setTool(t => t === 'ruler' ? 'pan' : 'ruler');
          break;
        case 'Escape':
          if (isFullscreen) toggleFullscreen();
          if (isDrawing) {
            setIsDrawing(false);
            setCurrentMeasurement(null);
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (measurements.length > 0) {
            setMeasurements(m => m.slice(0, -1));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlices, isFullscreen, isDrawing, measurements.length]);

  // Auto-play slices
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setSlice((s) => {
        if (s >= totalSlices) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 100 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, totalSlices, playbackSpeed]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Mouse wheel for zoom/slice
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(4, Math.max(0.25, z * delta)));
    } else {
      const delta = e.deltaY > 0 ? -1 : 1;
      setSlice((s) => Math.min(totalSlices, Math.max(1, s + delta)));
    }
  }, [totalSlices]);

  // Pan/Measure mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imageContainerRef.current) return;
    
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (tool === 'ruler') {
      setIsDrawing(true);
      setCurrentMeasurement({
        id: `m-${Date.now()}`,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
      });
    } else if (tool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [tool, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imageContainerRef.current) return;
    
    if (isDrawing && currentMeasurement) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Calculate distance in mm (512px image, 0.5mm/px)
      const dx = (x - currentMeasurement.startX!) * 5.12;
      const dy = (y - currentMeasurement.startY!) * 5.12;
      const distance = Math.sqrt(dx * dx + dy * dy) * PIXEL_SCALE;
      
      setCurrentMeasurement(prev => ({
        ...prev,
        endX: x,
        endY: y,
        distance,
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isDrawing, currentMeasurement, isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentMeasurement && currentMeasurement.distance! > 2) {
      setMeasurements(prev => [...prev, currentMeasurement as Measurement]);
    }
    setIsDrawing(false);
    setCurrentMeasurement(null);
    setIsPanning(false);
  }, [isDrawing, currentMeasurement]);

  // Export as image
  const handleExport = useCallback(async () => {
    if (!imageContainerRef.current) return;
    
    try {
      // Dynamic import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(imageContainerRef.current, {
        backgroundColor: '#000',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `mediscan_${modality}_slice${slice}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      // Fallback: alert user
      alert('Export requires html2canvas library. Install with: npm install html2canvas');
    }
  }, [slice, modality]);

  const deleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div 
      ref={containerRef}
      className={clsx(
        "flex flex-col bg-black overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50" : "h-full min-h-0 flex-1 rounded-xl border border-slate-700"
      )}
      style={{ minHeight: isFullscreen ? undefined : 'calc(100vh - 200px)' }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-slate-700">
        {/* Left Tools */}
        <div className="flex items-center gap-1">
          <ToolButton 
            icon={ZoomIn} 
            label="Zoom In (+)" 
            onClick={() => setZoom(z => Math.min(4, z * 1.2))} 
          />
          <ToolButton 
            icon={ZoomOut} 
            label="Zoom Out (-)" 
            onClick={() => setZoom(z => Math.max(0.25, z / 1.2))} 
          />
          <ToolButton icon={RotateCcw} label="Reset View (R)" onClick={handleReset} />
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <ToolButton 
            icon={Crosshair} 
            label="Pan Tool" 
            active={tool === 'pan'}
            onClick={() => setTool('pan')} 
          />
          <ToolButton 
            icon={Ruler} 
            label="Measure Tool (M)" 
            active={tool === 'ruler'}
            onClick={() => setTool('ruler')} 
            color="cyan"
          />
          {measurements.length > 0 && (
            <button
              onClick={() => setMeasurements([])}
              className="ml-1 px-2 py-1 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              Clear ({measurements.length})
            </button>
          )}
        </div>

        {/* Center - Slice Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSlice(1)}
            className="p-1 hover:bg-slate-700 rounded text-slate-400"
            title="First Slice"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSlice(s => Math.max(1, s - 1))}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg">
            <input
              type="number"
              value={slice}
              onChange={(e) => setSlice(Math.max(1, Math.min(totalSlices, parseInt(e.target.value) || 1)))}
              className="w-12 bg-transparent text-center text-white font-mono text-sm focus:outline-none"
            />
            <span className="text-slate-500">/</span>
            <span className="text-slate-400 font-mono text-sm">{totalSlices}</span>
          </div>
          <button
            onClick={() => setSlice(s => Math.min(totalSlices, s + 1))}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSlice(totalSlices)}
            className="p-1 hover:bg-slate-700 rounded text-slate-400"
            title="Last Slice"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          
          {/* Play Controls */}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-700">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={clsx(
                'p-1.5 rounded transition-all',
                isPlaying ? 'bg-teal-600 text-white' : 'hover:bg-slate-700 text-slate-400'
              )}
              title="Play/Pause (Space)"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setPlaybackSpeed(s => s >= 4 ? 0.5 : s * 2)}
              className="px-2 py-1 text-[10px] font-mono bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors"
              title="Playback Speed"
            >
              {playbackSpeed}x
            </button>
          </div>
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
          <ToolButton 
            icon={isFullscreen ? Minimize2 : Maximize2} 
            label="Fullscreen (F)" 
            onClick={toggleFullscreen} 
          />
          <ToolButton icon={Download} label="Export Image" onClick={handleExport} />
        </div>
      </div>

      {/* Window Presets */}
      <div className="flex items-center gap-1 p-2 bg-slate-900/80 border-b border-slate-700">
        <span className="text-xs text-slate-500 mr-2">Window:</span>
        {windowPresets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => setSelectedWindow(preset.name)}
            className={clsx(
              'px-3 py-1.5 text-xs rounded-lg transition-all font-medium',
              selectedWindow === preset.name
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            )}
          >
            {preset.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-500 font-mono">
          <span>WL: {currentWindow.center}</span>
          <span>WW: {currentWindow.width}</span>
        </div>
      </div>

      {/* Image Canvas */}
      <div
        className={clsx(
          "flex-1 relative overflow-hidden min-h-0",
          tool === 'pan' && "cursor-grab",
          tool === 'pan' && isPanning && "cursor-grabbing",
          tool === 'ruler' && "cursor-crosshair"
        )}
        style={{ minHeight: 0 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: zoom,
            x: pan.x,
            y: pan.y,
          }}
          transition={{ type: 'tween', duration: 0.1 }}
        >
          {/* CT Image Container */}
          <div 
            ref={imageContainerRef}
            className="w-[512px] h-[512px] bg-gray-900 rounded relative overflow-hidden"
            style={{
              filter: `brightness(${currentWindow.brightness}) contrast(${currentWindow.contrast})`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {imageUrl ? (
                /* Show actual uploaded image if available */
                <img 
                  src={imageUrl} 
                  alt="Medical Scan" 
                  className="w-full h-full object-contain"
                  style={{
                    filter: `brightness(${currentWindow.brightness}) contrast(${currentWindow.contrast})`
                  }}
                />
              ) : (
                /* Procedural CT Slice Visualization */
                <>
                  {/* Background - Black for CT */}
                  <div className="absolute inset-0 bg-black" />
                  
                  {/* Body outline - Outer skin/fat layer */}
                  <div 
                    className="absolute rounded-[45%] transition-all duration-200"
                    style={{
                      width: `${75 + sliceData.noise * 5}%`,
                      height: `${80 + sliceData.noise * 5}%`,
                      background: 'radial-gradient(ellipse at center, #4a4a4a 0%, #3d3d3d 40%, #2a2a2a 70%, #1a1a1a 100%)',
                      boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
                    }}
                  />
                  
                  {/* Muscle layer */}
                  <div 
                    className="absolute rounded-[45%] transition-all duration-200"
                    style={{
                      width: `${68 + sliceData.noise * 4}%`,
                      height: `${73 + sliceData.noise * 4}%`,
                      background: 'radial-gradient(ellipse at center, #5a5a5a 0%, #4a4a4a 60%, #3a3a3a 100%)',
                    }}
                  />
                  
                  {/* Rib cage outline */}
                  <div className="absolute" style={{ width: '72%', height: '75%' }}>
                    {/* Ribs - Left side */}
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={`rib-l-${i}`}
                        className="absolute rounded-full transition-all duration-200"
                        style={{
                          width: '8px',
                          height: '45%',
                          left: '8%',
                          top: `${15 + i * 10}%`,
                          background: 'linear-gradient(90deg, #888 0%, #aaa 50%, #888 100%)',
                          transform: `rotate(${25 - i * 3}deg)`,
                          opacity: 0.7 + sliceData.noise * 0.2,
                        }}
                      />
                    ))}
                    {/* Ribs - Right side */}
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={`rib-r-${i}`}
                        className="absolute rounded-full transition-all duration-200"
                        style={{
                          width: '8px',
                          height: '45%',
                          right: '8%',
                          top: `${15 + i * 10}%`,
                          background: 'linear-gradient(90deg, #888 0%, #aaa 50%, #888 100%)',
                          transform: `rotate(${-25 + i * 3}deg)`,
                          opacity: 0.7 + sliceData.noise * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Left Lung */}
                  <div 
                    className="absolute transition-all duration-200"
                    style={{
                      width: `${23 * sliceData.lungScale}%`,
                      height: `${36 * sliceData.lungScale}%`,
                      left: '15%',
                      top: `${22 - sliceData.lungScale * 5}%`,
                      transform: 'rotate(12deg)',
                      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #252525 50%, #1a1a1a 100%)',
                      borderRadius: '40%',
                      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                    }}
                  >
                    {/* Bronchial structures */}
                    <div 
                      className="absolute"
                      style={{
                        width: '30%',
                        height: '60%',
                        right: '10%',
                        top: '20%',
                        background: 'linear-gradient(180deg, #3a3a3a 0%, transparent 100%)',
                        borderRadius: '50%',
                        opacity: 0.5,
                      }}
                    />
                  </div>
                  
                  {/* Right Lung */}
                  <div 
                    className="absolute transition-all duration-200"
                    style={{
                      width: `${23 * sliceData.lungScale}%`,
                      height: `${36 * sliceData.lungScale}%`,
                      right: '15%',
                      top: `${22 - sliceData.lungScale * 5}%`,
                      transform: 'rotate(-12deg)',
                      background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #252525 50%, #1a1a1a 100%)',
                      borderRadius: '40%',
                      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
                    }}
                  >
                    {/* Bronchial structures */}
                    <div 
                      className="absolute"
                      style={{
                        width: '30%',
                        height: '60%',
                        left: '10%',
                        top: '20%',
                        background: 'linear-gradient(180deg, #3a3a3a 0%, transparent 100%)',
                        borderRadius: '50%',
                        opacity: 0.5,
                      }}
                    />
                  </div>
                  
                  {/* Heart */}
                  {sliceData.showHeart && (
                    <div 
                      className="absolute transition-all duration-200"
                      style={{
                        width: `${sliceData.heartSize * 0.5}px`,
                        height: `${sliceData.heartSize * 0.6}px`,
                        left: '38%',
                        top: '32%',
                        transform: 'rotate(-15deg)',
                        background: 'radial-gradient(ellipse at 40% 40%, #6a6a6a 0%, #555 40%, #444 100%)',
                        borderRadius: '45% 45% 50% 50%',
                        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.4)',
                      }}
                    />
                  )}
                  
                  {/* Aorta */}
                  {sliceData.showHeart && (
                    <div 
                      className="absolute rounded-full"
                      style={{
                        width: '25px',
                        height: '25px',
                        left: '48%',
                        top: '30%',
                        background: 'radial-gradient(circle, #777 0%, #555 70%, #444 100%)',
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
                      }}
                    />
                  )}
                  
                  {/* Spine/Vertebra */}
                  <div 
                    className="absolute transition-all duration-200"
                    style={{
                      width: `${sliceData.spineWidth + 10}px`,
                      height: '50px',
                      left: '50%',
                      bottom: '18%',
                      transform: 'translateX(-50%)',
                      background: 'radial-gradient(ellipse at center, #ccc 0%, #aaa 40%, #888 70%, #666 100%)',
                      borderRadius: '30%',
                      boxShadow: '0 0 10px rgba(255,255,255,0.2)',
                    }}
                  />
                  
                  {/* Spinal canal (dark center) */}
                  <div 
                    className="absolute rounded-full"
                    style={{
                      width: '12px',
                      height: '12px',
                      left: '50%',
                      bottom: '22%',
                      transform: 'translateX(-50%)',
                      background: '#222',
                    }}
                  />
                  
                  {/* Nodule (suspicious mass) */}
                  {sliceData.showNodule && (
                    <div 
                      className="absolute rounded-full transition-all duration-200"
                      style={{
                        width: `${sliceData.noduleSize + 4}px`,
                        height: `${sliceData.noduleSize + 4}px`,
                        right: '26%',
                        top: '30%',
                        opacity: sliceData.noduleOpacity,
                        background: 'radial-gradient(circle, #fff 0%, #ddd 30%, #aaa 60%, #888 100%)',
                        boxShadow: '0 0 15px rgba(255,255,255,0.6), inset 0 0 5px rgba(255,255,255,0.3)',
                      }}
                    />
                  )}
                  
                  {/* Scan artifacts / noise for realism */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(255,255,255,0.01) 2px,
                        rgba(255,255,255,0.01) 4px
                      )`,
                      opacity: 0.5 + sliceData.noise * 0.3,
                    }}
                  />
                </>
              )}
            </div>

            {/* AI Overlays */}
            {showHeatmap && sliceData.showNodule && (
              <div className="absolute inset-0 pointer-events-none">
                <div 
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: '80px',
                    height: '80px',
                    right: '22%',
                    top: '28%',
                    background: 'radial-gradient(circle, rgba(255,0,0,0.5) 0%, rgba(255,165,0,0.3) 40%, transparent 70%)',
                  }}
                />
                <div 
                  className="absolute text-[9px] font-bold text-red-400 bg-black/70 px-1.5 py-0.5 rounded"
                  style={{ right: '24%', top: '22%' }}
                >
                  97% Confidence
                </div>
              </div>
            )}

            {showSegmentation && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Left lung outline */}
                <div 
                  className="absolute border-2 border-blue-400/60 rounded-[40%]"
                  style={{
                    width: `${23 * sliceData.lungScale}%`,
                    height: `${36 * sliceData.lungScale}%`,
                    left: '15%',
                    top: `${22 - sliceData.lungScale * 5}%`,
                    transform: 'rotate(12deg)',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
                  }}
                />
                {/* Right lung outline */}
                <div 
                  className="absolute border-2 border-cyan-400/60 rounded-[40%]"
                  style={{
                    width: `${23 * sliceData.lungScale}%`,
                    height: `${36 * sliceData.lungScale}%`,
                    right: '15%',
                    top: `${22 - sliceData.lungScale * 5}%`,
                    transform: 'rotate(-12deg)',
                    boxShadow: '0 0 10px rgba(34, 211, 238, 0.3)',
                  }}
                />
                {sliceData.showHeart && (
                  <div 
                    className="absolute border-2 border-red-400/60 rounded-[45%]"
                    style={{
                      width: `${sliceData.heartSize * 0.5}px`,
                      height: `${sliceData.heartSize * 0.6}px`,
                      left: '38%',
                      top: '32%',
                      transform: 'rotate(-15deg)',
                      boxShadow: '0 0 10px rgba(248, 113, 113, 0.3)',
                    }}
                  />
                )}
              </div>
            )}

            {showAnnotations && sliceData.showNodule && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Bounding box */}
                <div 
                  className="absolute border-2 border-yellow-400"
                  style={{
                    width: '55px',
                    height: '55px',
                    right: '23%',
                    top: '26%',
                  }}
                >
                  <div className="absolute -top-5 left-0 text-[10px] font-bold text-yellow-400 bg-black/70 px-1.5 py-0.5 rounded whitespace-nowrap">
                    Nodule: {sliceData.noduleSize.toFixed(1)} mm
                  </div>
                </div>
                {/* Measurement line */}
                <svg className="absolute inset-0 w-full h-full">
                  <line
                    x1="72%"
                    y1="32%"
                    x2="78%"
                    y2="38%"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                </svg>
              </div>
            )}

            {/* User Measurements */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {measurements.map((m) => (
                <g key={m.id}>
                  <line
                    x1={`${m.startX}%`}
                    y1={`${m.startY}%`}
                    x2={`${m.endX}%`}
                    y2={`${m.endY}%`}
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx={`${m.startX}%`} cy={`${m.startY}%`} r="4" fill="#22d3ee" />
                  <circle cx={`${m.endX}%`} cy={`${m.endY}%`} r="4" fill="#22d3ee" />
                  <text
                    x={`${(m.startX + m.endX) / 2}%`}
                    y={`${(m.startY + m.endY) / 2 - 2}%`}
                    fill="#22d3ee"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{ textShadow: '0 0 4px black' }}
                  >
                    {m.distance.toFixed(1)} mm
                  </text>
                </g>
              ))}
              {/* Current drawing measurement */}
              {currentMeasurement && isDrawing && (
                <g>
                  <line
                    x1={`${currentMeasurement.startX}%`}
                    y1={`${currentMeasurement.startY}%`}
                    x2={`${currentMeasurement.endX}%`}
                    y2={`${currentMeasurement.endY}%`}
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  <circle cx={`${currentMeasurement.startX}%`} cy={`${currentMeasurement.startY}%`} r="4" fill="#22d3ee" />
                  <circle cx={`${currentMeasurement.endX}%`} cy={`${currentMeasurement.endY}%`} r="4" fill="#22d3ee" opacity="0.7" />
                  <text
                    x={`${((currentMeasurement.startX || 0) + (currentMeasurement.endX || 0)) / 2}%`}
                    y={`${((currentMeasurement.startY || 0) + (currentMeasurement.endY || 0)) / 2 - 2}%`}
                    fill="#22d3ee"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{ textShadow: '0 0 4px black' }}
                  >
                    {(currentMeasurement.distance || 0).toFixed(1)} mm
                  </text>
                </g>
              )}
            </svg>
          </div>
        </motion.div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/80 rounded-lg text-xs text-white font-mono flex items-center gap-2">
          <span>{Math.round(zoom * 100)}%</span>
          {zoom !== 1 && (
            <button onClick={handleReset} className="text-slate-400 hover:text-white">
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Metadata overlay */}
        <div className="absolute top-4 left-4 text-xs text-white/80 space-y-1 bg-black/60 p-3 rounded-lg backdrop-blur-sm">
          <p><span className="text-slate-400">Modality:</span> {modality}</p>
          <p><span className="text-slate-400">Region:</span> {bodyPart}</p>
          <p><span className="text-slate-400">Slice:</span> {slice} of {totalSlices}</p>
          <p><span className="text-slate-400">Window:</span> {selectedWindow}</p>
        </div>

        {/* AI Active Indicator */}
        {(showHeatmap || showSegmentation || showAnnotations) && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-full font-medium shadow-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI Overlays Active
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="absolute bottom-4 left-4 text-[9px] text-slate-500 bg-black/60 p-2 rounded-lg space-y-0.5 backdrop-blur-sm">
          <p>↑↓←→ Navigate • +/- Zoom • R Reset</p>
          <p>Space Play • F Fullscreen • M Measure</p>
          <p>H Heatmap • S Segment • A Annotate</p>
        </div>
      </div>

      {/* Slice Slider */}
      <div className="p-3 bg-slate-900 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium w-10">Slice</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min={1}
              max={totalSlices}
              value={slice}
              onChange={(e) => setSlice(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            {/* Nodule indicator */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-yellow-500 rounded pointer-events-none"
              style={{ left: `${(0.55 * 100)}%` }}
              title="Nodule visible here"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono w-16 text-right">{slice}/{totalSlices}</span>
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
  color?: 'default' | 'orange' | 'blue' | 'purple' | 'cyan';
}

function ToolButton({ icon: Icon, label, onClick, active, color = 'default' }: ToolButtonProps) {
  const colors = {
    default: active ? 'bg-teal-600 text-white' : 'hover:bg-slate-700 text-slate-400',
    orange: active ? 'bg-gradient-to-r from-red-500 to-orange-400 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400',
    blue: active ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400',
    purple: active ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400',
    cyan: active ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'p-2 rounded-lg transition-all relative group',
        colors[color]
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-white shadow-xl">
        {label}
      </span>
    </button>
  );
}
