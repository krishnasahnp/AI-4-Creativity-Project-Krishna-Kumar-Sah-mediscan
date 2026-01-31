'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: { icon: CheckCircle, bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
    error: { icon: XCircle, bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
    info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  };

  const { icon: Icon, bg, border, text } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl ${bg} ${border}`}
    >
      <Icon className={`w-5 h-5 ${text}`} />
      <span className="text-sm font-medium text-white">{message}</span>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </motion.div>
  );
}
