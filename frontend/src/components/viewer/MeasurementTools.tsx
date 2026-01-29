'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Ruler, 
  Circle, 
  Square, 
  Move, 
  Trash2, 
  MousePointer,
  Download
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Measurement {
  id: string;
  type: 'length' | 'area' | 'roi';
  points: Point[];
  value: number;
  unit: string;
  label?: string;
}

interface MeasurementToolsProps {
  imageWidth: number;
  imageHeight: number;
  pixelSpacing?: [number, number]; // mm per pixel
  onMeasurementsChange?: (measurements: Measurement[]) => void;
}

export default function MeasurementTools({
  imageWidth,
  imageHeight,
  pixelSpacing = [1, 1],
  onMeasurementsChange,
}: MeasurementToolsProps) {
  const [activeTool, setActiveTool] = useState<'select' | 'length' | 'area' | 'roi'>('select');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'length', icon: Ruler, label: 'Length' },
    { id: 'area', icon: Circle, label: 'Area' },
    { id: 'roi', icon: Square, label: 'ROI' },
  ] as const;

  // Calculate distance between two points
  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = (p2.x - p1.x) * pixelSpacing[0];
    const dy = (p2.y - p1.y) * pixelSpacing[1];
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate area of polygon
  const calculateArea = (points: Point[]): number => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;
    return area * pixelSpacing[0] * pixelSpacing[1];
  };

  // Calculate ROI area (rectangle)
  const calculateROI = (points: Point[]): number => {
    if (points.length < 2) return 0;
    const width = Math.abs(points[1].x - points[0].x) * pixelSpacing[0];
    const height = Math.abs(points[1].y - points[0].y) * pixelSpacing[1];
    return width * height;
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * imageWidth;
    const y = ((e.clientY - rect.top) / rect.height) * imageHeight;
    const point = { x, y };

    if (activeTool === 'length') {
      if (currentPoints.length === 0) {
        setCurrentPoints([point]);
        setIsDrawing(true);
      } else {
        const distance = calculateDistance(currentPoints[0], point);
        const newMeasurement: Measurement = {
          id: `m-${Date.now()}`,
          type: 'length',
          points: [currentPoints[0], point],
          value: distance,
          unit: 'mm',
        };
        setMeasurements(prev => [...prev, newMeasurement]);
        setCurrentPoints([]);
        setIsDrawing(false);
      }
    } else if (activeTool === 'roi') {
      if (currentPoints.length === 0) {
        setCurrentPoints([point]);
        setIsDrawing(true);
      } else {
        const area = calculateROI([currentPoints[0], point]);
        const newMeasurement: Measurement = {
          id: `m-${Date.now()}`,
          type: 'roi',
          points: [currentPoints[0], point],
          value: area,
          unit: 'mm²',
        };
        setMeasurements(prev => [...prev, newMeasurement]);
        setCurrentPoints([]);
        setIsDrawing(false);
      }
    } else if (activeTool === 'area') {
      setCurrentPoints(prev => [...prev, point]);
      setIsDrawing(true);
    }
  }, [activeTool, currentPoints, imageWidth, imageHeight, pixelSpacing]);

  const handleDoubleClick = useCallback(() => {
    if (activeTool === 'area' && currentPoints.length >= 3) {
      const area = calculateArea(currentPoints);
      const newMeasurement: Measurement = {
        id: `m-${Date.now()}`,
        type: 'area',
        points: [...currentPoints],
        value: area,
        unit: 'mm²',
      };
      setMeasurements(prev => [...prev, newMeasurement]);
      setCurrentPoints([]);
      setIsDrawing(false);
    }
  }, [activeTool, currentPoints]);

  const deleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  };

  const clearAll = () => {
    setMeasurements([]);
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  const exportMeasurements = () => {
    const data = measurements.map(m => ({
      type: m.type,
      value: m.value.toFixed(2),
      unit: m.unit,
      points: m.points,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'measurements.json';
    a.click();
  };

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing measurements
    measurements.forEach(m => {
      ctx.strokeStyle = '#3B82F6';
      ctx.fillStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.font = '12px sans-serif';

      if (m.type === 'length' && m.points.length === 2) {
        const [p1, p2] = m.points;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Draw endpoints
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
        ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw label
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.fillStyle = '#fff';
        ctx.fillText(`${m.value.toFixed(1)} ${m.unit}`, midX + 5, midY - 5);
      } else if (m.type === 'roi' && m.points.length === 2) {
        const [p1, p2] = m.points;
        ctx.strokeRect(
          Math.min(p1.x, p2.x),
          Math.min(p1.y, p2.y),
          Math.abs(p2.x - p1.x),
          Math.abs(p2.y - p1.y)
        );
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(
          Math.min(p1.x, p2.x),
          Math.min(p1.y, p2.y),
          Math.abs(p2.x - p1.x),
          Math.abs(p2.y - p1.y)
        );
        ctx.fillStyle = '#fff';
        ctx.fillText(`${m.value.toFixed(1)} ${m.unit}`, Math.min(p1.x, p2.x), Math.min(p1.y, p2.y) - 5);
      } else if (m.type === 'area' && m.points.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        m.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();

        // Draw label at centroid
        const cx = m.points.reduce((sum, p) => sum + p.x, 0) / m.points.length;
        const cy = m.points.reduce((sum, p) => sum + p.y, 0) / m.points.length;
        ctx.fillStyle = '#fff';
        ctx.fillText(`${m.value.toFixed(1)} ${m.unit}`, cx, cy);
      }
    });

    // Draw current points
    if (currentPoints.length > 0) {
      ctx.strokeStyle = '#22C55E';
      ctx.fillStyle = '#22C55E';
      ctx.setLineDash([5, 5]);

      if (activeTool === 'length' || activeTool === 'roi') {
        ctx.beginPath();
        ctx.arc(currentPoints[0].x, currentPoints[0].y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (activeTool === 'area') {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        currentPoints.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.setLineDash([]);
    }
  }, [measurements, currentPoints, activeTool]);

  useEffect(() => {
    onMeasurementsChange?.(measurements);
  }, [measurements, onMeasurementsChange]);

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-[var(--color-bg-secondary)] rounded-lg p-2 shadow-lg">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === tool.id
                ? 'bg-blue-500 text-white'
                : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
            }`}
            title={tool.label}
          >
            <tool.icon className="w-5 h-5" />
          </button>
        ))}
        <div className="border-t border-[var(--color-border)] my-1" />
        <button
          onClick={clearAll}
          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
          title="Clear All"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <button
          onClick={exportMeasurements}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
          title="Export"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        width={imageWidth}
        height={imageHeight}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        className="absolute inset-0 cursor-crosshair"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Measurements Panel */}
      {measurements.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-[var(--color-bg-secondary)] rounded-lg p-3 shadow-lg w-56 max-h-64 overflow-y-auto">
          <h4 className="font-medium text-sm mb-2">Measurements</h4>
          <div className="space-y-2">
            {measurements.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between text-sm bg-[var(--color-bg-tertiary)] rounded p-2"
              >
                <div className="flex items-center gap-2">
                  {m.type === 'length' && <Ruler className="w-3 h-3" />}
                  {m.type === 'area' && <Circle className="w-3 h-3" />}
                  {m.type === 'roi' && <Square className="w-3 h-3" />}
                  <span>{m.value.toFixed(1)} {m.unit}</span>
                </div>
                <button
                  onClick={() => deleteMeasurement(m.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tool hint */}
      {isDrawing && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-[var(--color-bg-secondary)] rounded-lg px-4 py-2 text-sm">
          {activeTool === 'length' && 'Click to set end point'}
          {activeTool === 'area' && 'Click to add points, double-click to finish'}
          {activeTool === 'roi' && 'Click to set opposite corner'}
        </div>
      )}
    </div>
  );
}
