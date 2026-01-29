'use client';

import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function ConfidenceBadge({
  confidence,
  size = 'md',
  showLabel = true,
  animated = true,
  variant = 'default',
}: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);
  
  // Determine color and status based on confidence
  const getStatus = () => {
    if (confidence >= 0.9) return { color: 'green', label: 'High', icon: CheckCircle };
    if (confidence >= 0.7) return { color: 'yellow', label: 'Medium', icon: AlertTriangle };
    if (confidence >= 0.5) return { color: 'orange', label: 'Low', icon: HelpCircle };
    return { color: 'red', label: 'Very Low', icon: XCircle };
  };

  const status = getStatus();
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const colorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const Icon = status.icon;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={animated ? { scale: 0.8, opacity: 0 } : false}
        animate={animated ? { scale: 1, opacity: 1 } : false}
        className={`inline-flex items-center gap-1 rounded-full border ${colorClasses[status.color as keyof typeof colorClasses]} ${sizeClasses[size]}`}
        role="status"
        aria-label={`${percentage}% confidence - ${status.label}`}
      >
        <Icon className={iconSizes[size]} aria-hidden="true" />
        <span className="font-medium">{percentage}%</span>
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        initial={animated ? { y: 10, opacity: 0 } : false}
        animate={animated ? { y: 0, opacity: 1 } : false}
        className={`rounded-lg border p-3 ${colorClasses[status.color as keyof typeof colorClasses]}`}
        role="status"
        aria-label={`${percentage}% confidence - ${status.label}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={iconSizes[size]} aria-hidden="true" />
            <span className="font-medium">{status.label} Confidence</span>
          </div>
          <span className="text-lg font-bold">{percentage}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-black/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              status.color === 'green' ? 'bg-green-500' :
              status.color === 'yellow' ? 'bg-yellow-500' :
              status.color === 'orange' ? 'bg-orange-500' :
              'bg-red-500'
            }`}
          />
        </div>
        
        <p className="text-xs mt-2 opacity-80">
          {confidence >= 0.9 && 'Model is highly confident in this prediction.'}
          {confidence >= 0.7 && confidence < 0.9 && 'Model has moderate confidence. Consider additional review.'}
          {confidence >= 0.5 && confidence < 0.7 && 'Low confidence. Manual verification recommended.'}
          {confidence < 0.5 && 'Very low confidence. Prediction may be unreliable.'}
        </p>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={animated ? { scale: 0.8, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : false}
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses[status.color as keyof typeof colorClasses]} ${sizeClasses[size]}`}
      role="status"
      aria-label={`${percentage}% confidence - ${status.label}`}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
      <span className="font-medium">{percentage}%</span>
      {showLabel && <span className="opacity-80">• {status.label}</span>}
    </motion.div>
  );
}

// Trend indicator component
interface TrendIndicatorProps {
  value: number;
  previousValue: number;
  unit?: string;
  showValue?: boolean;
}

export function TrendIndicator({ value, previousValue, unit = '', showValue = true }: TrendIndicatorProps) {
  const change = value - previousValue;
  const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  
  const getTrendStatus = () => {
    if (percentChange > 5) return { icon: TrendingUp, color: 'text-green-400', label: 'increasing' };
    if (percentChange < -5) return { icon: TrendingDown, color: 'text-red-400', label: 'decreasing' };
    return { icon: Minus, color: 'text-gray-400', label: 'stable' };
  };

  const status = getTrendStatus();
  const Icon = status.icon;

  return (
    <div 
      className={`flex items-center gap-1 text-sm ${status.color}`}
      role="status"
      aria-label={`${status.label}: ${percentChange.toFixed(1)}% change`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      {showValue && (
        <span>
          {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%{unit && ` ${unit}`}
        </span>
      )}
    </div>
  );
}

// Quality indicator for images/audio
interface QualityIndicatorProps {
  quality: 'good' | 'medium' | 'poor';
  label?: string;
}

export function QualityIndicator({ quality, label }: QualityIndicatorProps) {
  const config = {
    good: { color: 'bg-green-500', text: 'text-green-400', bgColor: 'bg-green-500/20' },
    medium: { color: 'bg-yellow-500', text: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    poor: { color: 'bg-red-500', text: 'text-red-400', bgColor: 'bg-red-500/20' },
  };

  const c = config[quality];

  return (
    <div 
      className={`flex items-center gap-2 px-2 py-1 rounded ${c.bgColor}`}
      role="status"
      aria-label={`Quality: ${quality}`}
    >
      <div className="flex gap-0.5">
        <div className={`w-1.5 h-4 rounded-sm ${quality !== 'poor' ? c.color : 'bg-gray-600'}`} />
        <div className={`w-1.5 h-4 rounded-sm ${quality === 'good' ? c.color : 'bg-gray-600'}`} />
        <div className={`w-1.5 h-4 rounded-sm ${quality === 'good' ? c.color : 'bg-gray-600'}`} />
      </div>
      <span className={`text-sm font-medium ${c.text}`}>
        {label || quality.charAt(0).toUpperCase() + quality.slice(1)}
      </span>
    </div>
  );
}

// Severity badge for findings
interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high' | 'critical';
  size?: 'sm' | 'md';
}

export function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  const config = {
    low: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Low' },
    medium: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Medium' },
    high: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'High' },
    critical: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Critical' },
  };

  const c = config[severity];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <span 
      className={`inline-flex items-center rounded-full border ${c.color} ${sizeClass}`}
      role="status"
      aria-label={`Severity: ${severity}`}
    >
      {severity === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" aria-hidden="true" />}
      {c.label}
    </span>
  );
}
