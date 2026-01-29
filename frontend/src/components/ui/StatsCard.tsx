'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

const colorConfig: Record<string, { 
  gradient: string; 
  glow: string; 
  bg: string;
  border: string;
}> = {
  blue: {
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    glow: 'rgba(59, 130, 246, 0.3)',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.2)',
  },
  green: {
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    glow: 'rgba(16, 185, 129, 0.3)',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.2)',
  },
  cyan: {
    gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    glow: 'rgba(6, 182, 212, 0.3)',
    bg: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.2)',
  },
  purple: {
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    glow: 'rgba(139, 92, 246, 0.3)',
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.2)',
  },
  teal: {
    gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)',
    glow: 'rgba(13, 148, 136, 0.3)',
    bg: 'rgba(13, 148, 136, 0.1)',
    border: 'rgba(13, 148, 136, 0.2)',
  },
};

export default function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: StatsCardProps) {
  const config = colorConfig[color] || colorConfig.teal;
  
  return (
    <motion.div 
      className="relative overflow-hidden rounded-2xl p-6 cursor-pointer group"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Top gradient line */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ background: config.gradient }}
      />
      
      {/* Subtle glow effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${config.glow}, transparent 50%)`,
        }}
      />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <p className="text-sm font-medium text-[#94a3b8] mb-2 flex items-center gap-2">
            {title}
          </p>
          
          {/* Value */}
          <p 
            className="text-3xl font-bold mb-3"
            style={{
              background: config.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {value}
          </p>
          
          {/* Trend */}
          <div
            className={clsx(
              'flex items-center gap-1.5 text-sm font-medium',
            )}
            style={{
              color: trend === 'up' ? '#34d399' : '#fb7185',
            }}
          >
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: trend === 'up' 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(244, 63, 94, 0.2)',
              }}
            >
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
            </div>
            <span>{change}</span>
            <span className="text-[#64748b] font-normal">vs last week</span>
          </div>
        </div>
        
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3"
          style={{
            background: config.gradient,
            boxShadow: `0 4px 20px ${config.glow}, 0 0 30px ${config.glow}`,
          }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
      
      {/* Sparkle decoration */}
      <Sparkles 
        className="absolute bottom-3 right-3 w-4 h-4 text-[#64748b] opacity-40 group-hover:opacity-70 transition-opacity" 
      />
    </motion.div>
  );
}
