'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

const colorMap: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  cyan: 'from-cyan-500 to-cyan-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
};

const colorBgMap: Record<string, string> = {
  blue: 'bg-blue-500/10',
  green: 'bg-green-500/10',
  cyan: 'bg-cyan-500/10',
  purple: 'bg-purple-500/10',
  orange: 'bg-orange-500/10',
};

export default function StatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: StatsCardProps) {
  return (
    <div className="card group cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <div
            className={clsx(
              'flex items-center gap-1 mt-2 text-sm',
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            )}
          >
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{change}</span>
            <span className="text-[var(--color-text-muted)]">vs last week</span>
          </div>
        </div>
        <div
          className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
            colorMap[color]
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
