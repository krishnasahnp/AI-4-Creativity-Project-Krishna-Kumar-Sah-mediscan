'use client';

import { motion } from 'framer-motion';

export interface Hotspot {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  radius: number; // percentage of container
  intensity: number; // 0-1
  label?: string;
  finding?: string;
}

interface HeatmapOverlayProps {
  hotspots: Hotspot[];
  colorScheme?: 'heat' | 'viridis' | 'coolwarm';
  opacity?: number;
  visible?: boolean;
  showLabels?: boolean;
  onHotspotClick?: (hotspot: Hotspot, index: number) => void;
}

const colorSchemes = {
  heat: {
    gradient: [
      { offset: '0%', color: 'rgba(255, 0, 0, 0)' },
      { offset: '30%', color: 'rgba(255, 0, 0, 0.2)' },
      { offset: '50%', color: 'rgba(255, 165, 0, 0.5)' },
      { offset: '70%', color: 'rgba(255, 255, 0, 0.7)' },
      { offset: '100%', color: 'rgba(255, 255, 255, 0.9)' },
    ],
    stroke: '#ff4444',
  },
  viridis: {
    gradient: [
      { offset: '0%', color: 'rgba(68, 1, 84, 0)' },
      { offset: '25%', color: 'rgba(59, 82, 139, 0.3)' },
      { offset: '50%', color: 'rgba(33, 145, 140, 0.5)' },
      { offset: '75%', color: 'rgba(94, 201, 98, 0.7)' },
      { offset: '100%', color: 'rgba(253, 231, 37, 0.9)' },
    ],
    stroke: '#21918c',
  },
  coolwarm: {
    gradient: [
      { offset: '0%', color: 'rgba(59, 76, 192, 0)' },
      { offset: '50%', color: 'rgba(221, 221, 221, 0.3)' },
      { offset: '100%', color: 'rgba(180, 4, 38, 0.9)' },
    ],
    stroke: '#b40426',
  },
};

export default function HeatmapOverlay({
  hotspots,
  colorScheme = 'heat',
  opacity = 0.7,
  visible = true,
  showLabels = true,
  onHotspotClick,
}: HeatmapOverlayProps) {
  if (!visible || hotspots.length === 0) return null;

  const scheme = colorSchemes[colorScheme];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ opacity }}
      >
        <defs>
          {hotspots.map((_, index) => (
            <radialGradient
              key={`gradient-${index}`}
              id={`heatmap-gradient-${index}`}
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              {scheme.gradient.map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </radialGradient>
          ))}
        </defs>

        {/* Render heatmap spots */}
        {hotspots.map((spot, index) => (
          <motion.g
            key={index}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: spot.intensity, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <ellipse
              cx={spot.x}
              cy={spot.y}
              rx={spot.radius * 1.5}
              ry={spot.radius * 1.5}
              fill={`url(#heatmap-gradient-${index})`}
              className="pointer-events-auto cursor-pointer"
              onClick={() => onHotspotClick?.(spot, index)}
            />
            {/* Intensity ring */}
            <circle
              cx={spot.x}
              cy={spot.y}
              r={spot.radius}
              fill="none"
              stroke={scheme.stroke}
              strokeWidth="0.3"
              strokeDasharray="1 0.5"
              opacity={0.6}
            />
          </motion.g>
        ))}
      </svg>

      {/* Labels */}
      {showLabels && (
        <div className="absolute inset-0">
          {hotspots.map((spot, index) => (
            <motion.div
              key={`label-${index}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: `${spot.x}%`,
                top: `${spot.y - spot.radius - 3}%`,
                transform: 'translateX(-50%)',
              }}
              onClick={() => onHotspotClick?.(spot, index)}
            >
              {spot.label && (
                <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap backdrop-blur-sm border border-white/20">
                  <span className="font-medium">{spot.label}</span>
                  <span className="ml-2 text-yellow-400">{Math.round(spot.intensity * 100)}%</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* AI Badge */}
      <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-lg">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        AI Heatmap
      </div>
    </div>
  );
}
