'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface BoundingBox {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage
  height: number; // percentage
  label: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  confidence: number; // 0-1
  measurements?: string[];
  description?: string;
}

export interface MeasurementLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: string;
  unit: string;
}

interface AnnotationOverlayProps {
  boxes: BoundingBox[];
  measurements: MeasurementLine[];
  visible?: boolean;
  showLabels?: boolean;
  showMeasurements?: boolean;
  selectedBox?: string;
  onBoxClick?: (box: BoundingBox) => void;
}

const severityColors = {
  normal: { bg: '#22c55e', border: '#16a34a', text: '#dcfce7' },
  mild: { bg: '#eab308', border: '#ca8a04', text: '#fef9c3' },
  moderate: { bg: '#f97316', border: '#ea580c', text: '#ffedd5' },
  severe: { bg: '#ef4444', border: '#dc2626', text: '#fee2e2' },
};

// Generate mock annotations based on modality
export function generateMockAnnotations(modality: string): { boxes: BoundingBox[], measurements: MeasurementLine[] } {
  switch (modality.toUpperCase()) {
    case 'CT':
      return {
        boxes: [
          {
            id: 'nodule-1',
            x: 68, y: 22, width: 12, height: 10,
            label: 'Pulmonary Nodule',
            severity: 'moderate',
            confidence: 0.94,
            measurements: ['11.2 x 9.8 mm', '45 HU', '1.4 cc'],
            description: 'Spiculated margins, RUL apical segment'
          },
          {
            id: 'lymph-node',
            x: 45, y: 45, width: 8, height: 6,
            label: 'Lymph Node',
            severity: 'mild',
            confidence: 0.78,
            measurements: ['12mm short axis'],
            description: 'Subcarinal station 7'
          },
        ],
        measurements: [
          { id: 'm1', x1: 68, y1: 27, x2: 80, y2: 27, value: '11.2', unit: 'mm' },
          { id: 'm2', x1: 74, y1: 22, x2: 74, y2: 32, value: '9.8', unit: 'mm' },
        ]
      };
    case 'MRI':
      return {
        boxes: [
          {
            id: 'lesion-1',
            x: 32, y: 28, width: 10, height: 8,
            label: 'WM Hyperintensity',
            severity: 'moderate',
            confidence: 0.89,
            measurements: ['6.5mm'],
            description: 'Periventricular, Dawson finger pattern'
          },
          {
            id: 'lesion-2',
            x: 58, y: 32, width: 8, height: 6,
            label: 'Subcortical Lesion',
            severity: 'mild',
            confidence: 0.85,
            measurements: ['4.2mm'],
            description: 'Left frontal subcortical white matter'
          },
        ],
        measurements: [
          { id: 'm1', x1: 32, y1: 32, x2: 42, y2: 32, value: '6.5', unit: 'mm' },
        ]
      };
    case 'XRAY':
    case 'X-RAY':
      return {
        boxes: [
          {
            id: 'fracture',
            x: 55, y: 60, width: 18, height: 12,
            label: 'Fracture Site',
            severity: 'severe',
            confidence: 0.97,
            measurements: ['2cm proximal to articular surface', '20° dorsal angulation'],
            description: 'Colles-type fracture, distal radius'
          },
          {
            id: 'swelling',
            x: 50, y: 55, width: 25, height: 20,
            label: 'Soft Tissue Swelling',
            severity: 'moderate',
            confidence: 0.82,
            description: 'Dorsal wrist aspect'
          },
        ],
        measurements: [
          { id: 'm1', x1: 55, y1: 66, x2: 73, y2: 66, value: '4', unit: 'mm shortening' },
          { id: 'm2', x1: 64, y1: 55, x2: 64, y2: 72, value: '20', unit: '° angulation' },
        ]
      };
    case 'ULTRASOUND':
    case 'US':
      return {
        boxes: [
          {
            id: 'liver',
            x: 20, y: 30, width: 45, height: 35,
            label: 'Liver (Steatosis)',
            severity: 'moderate',
            confidence: 0.86,
            measurements: ['15.4cm span', 'Grade 2 echogenicity'],
            description: 'Diffuse increased echogenicity'
          },
        ],
        measurements: [
          { id: 'm1', x1: 20, y1: 47, x2: 65, y2: 47, value: '15.4', unit: 'cm' },
        ]
      };
    default:
      return { boxes: [], measurements: [] };
  }
}

export default function AnnotationOverlay({
  boxes,
  measurements,
  visible = true,
  showLabels = true,
  showMeasurements = true,
  selectedBox,
  onBoxClick,
}: AnnotationOverlayProps) {
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          {/* Animated dash pattern */}
          <pattern id="dash-pattern" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M 0 2 L 4 2" stroke="white" strokeWidth="0.5" />
          </pattern>
          
          {/* Glow filter */}
          <filter id="annotation-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Bounding Boxes */}
        <AnimatePresence>
          {boxes.map((box) => {
            const colors = severityColors[box.severity];
            const isSelected = selectedBox === box.id;
            const isHovered = hoveredBox === box.id;

            return (
              <motion.g
                key={box.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Background fill on hover */}
                {(isHovered || isSelected) && (
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    fill={colors.bg}
                    fillOpacity={0.15}
                  />
                )}

                {/* Main bounding box */}
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.width}
                  height={box.height}
                  fill="none"
                  stroke={colors.bg}
                  strokeWidth={isHovered || isSelected ? '0.8' : '0.5'}
                  strokeDasharray={isSelected ? 'none' : '2 1'}
                  filter={isSelected ? 'url(#annotation-glow)' : undefined}
                  className="pointer-events-auto cursor-pointer"
                  onMouseEnter={() => setHoveredBox(box.id)}
                  onMouseLeave={() => setHoveredBox(null)}
                  onClick={() => onBoxClick?.(box)}
                />

                {/* Corner markers */}
                {[
                  [box.x, box.y],
                  [box.x + box.width, box.y],
                  [box.x, box.y + box.height],
                  [box.x + box.width, box.y + box.height],
                ].map(([cx, cy], i) => (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={0.8}
                    fill={colors.bg}
                  />
                ))}
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Measurement Lines */}
        {showMeasurements && measurements.map((line) => (
          <g key={line.id}>
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#22d3ee"
              strokeWidth="0.4"
              markerEnd="url(#arrow)"
              markerStart="url(#arrow)"
            />
            {/* Measurement text background */}
            <rect
              x={(line.x1 + line.x2) / 2 - 4}
              y={(line.y1 + line.y2) / 2 - 2}
              width="8"
              height="4"
              fill="rgba(0,0,0,0.8)"
              rx="0.5"
            />
            <text
              x={(line.x1 + line.x2) / 2}
              y={(line.y1 + line.y2) / 2 + 0.8}
              textAnchor="middle"
              fill="#22d3ee"
              fontSize="2.5"
              fontWeight="bold"
            >
              {line.value}{line.unit}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating Labels */}
      {showLabels && (
        <div className="absolute inset-0">
          {boxes.map((box) => {
            const colors = severityColors[box.severity];
            const isHovered = hoveredBox === box.id;
            const isSelected = selectedBox === box.id;

            return (
              <div
                key={`label-${box.id}`}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${box.x}%`,
                  top: `${box.y - 3}%`,
                  transform: 'translateY(-100%)',
                }}
                onMouseEnter={() => setHoveredBox(box.id)}
                onMouseLeave={() => setHoveredBox(null)}
                onClick={() => onBoxClick?.(box)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start"
                >
                  {/* Label badge */}
                  <div
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold shadow-lg flex items-center gap-1"
                    style={{ backgroundColor: colors.bg, color: 'white' }}
                  >
                    <span>{box.label}</span>
                    <span className="opacity-80">{Math.round(box.confidence * 100)}%</span>
                  </div>

                  {/* Expanded details on hover */}
                  <AnimatePresence>
                    {(isHovered || isSelected) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1 bg-black/90 text-white text-[9px] px-2 py-1.5 rounded-lg border backdrop-blur-sm max-w-[150px]"
                        style={{ borderColor: colors.bg }}
                      >
                        {box.description && (
                          <p className="text-slate-300 mb-1">{box.description}</p>
                        )}
                        {box.measurements && box.measurements.length > 0 && (
                          <div className="space-y-0.5">
                            {box.measurements.map((m, i) => (
                              <div key={i} className="text-cyan-300 font-mono">{m}</div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Badge */}
      <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-lg">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h4v4H7V7zm6 0h4v2h-4V7zm0 4h4v2h-4v-2zm-6 4h10v2H7v-2z" />
        </svg>
        AI Annotations
      </div>
    </div>
  );
}
