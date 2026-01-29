'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  FileImage, 
  Clock, 
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Cpu,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  HeartPulse,
} from 'lucide-react';
import Link from 'next/link';
import StatsCard from './ui/StatsCard';
import RecentStudies from './RecentStudies';
import ActivityChart from './charts/ActivityChart';
import { useCases } from '@/context/CasesContext';

export default function Dashboard() {
  const { cases, stats: caseStats } = useCases();

  const urgentCount = cases.filter(c => c.tags.includes('urgent')).length;
  const pendingCount = cases.filter(c => c.status === 'pending').length;

  const quickActions = [
    {
      icon: FileImage,
      label: 'Upload New Study',
      description: 'DICOM, Images, or Videos',
      href: '/upload',
      gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)',
      glow: 'rgba(13, 148, 136, 0.3)',
    },
    {
      icon: Activity,
      label: 'View Recent Cases',
      description: 'Active patient workflows',
      href: '/cases',
      gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
      glow: 'rgba(59, 130, 246, 0.3)',
    },
    {
      icon: Cpu,
      label: 'Run AI Analysis',
      description: `${pendingCount} studies pending`,
      href: '/analyze',
      gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
      glow: 'rgba(139, 92, 246, 0.3)',
    },
    {
      icon: AlertTriangle,
      label: 'Review Flagged',
      description: `${urgentCount} items need attention`,
      href: '/cases?filter=urgent',
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      glow: 'rgba(245, 158, 11, 0.3)',
    },
  ];


  const stats = [
    {
      title: 'Total Studies',
      value: caseStats.total.toLocaleString(),
      change: '+12.5%',
      trend: 'up' as const,
      icon: FileImage,
      color: 'teal'
    },
    {
      title: 'Processed Today',
      value: caseStats.processedToday.toString(),
      change: '+8.2%',
      trend: 'up' as const,
      icon: CheckCircle2,
      color: 'green'
    },
    {
      title: 'Avg. Processing Time',
      value: '2.4s',
      change: '-15.3%',
      trend: 'up' as const,
      icon: Clock,
      color: 'cyan'
    },
    {
      title: 'AI Accuracy',
      value: `${caseStats.accuracy}%`,
      change: '+2.1%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#f1f5f9]">
                Welcome to{' '}
                <span 
                  style={{
                    background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 50%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  MediVision AI
                </span>
              </h1>
              <div 
                className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                Live
              </div>
            </div>
            <p className="text-[#94a3b8] text-lg">
              AI-powered medical imaging analysis platform
            </p>
          </div>
          
          {/* AI Status Card */}
          <motion.div 
            className="flex items-center gap-4 px-5 py-3 rounded-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(6, 182, 212, 0.05))',
              border: '1px solid rgba(13, 148, 136, 0.2)',
            }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center animate-breathe"
              style={{
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                boxShadow: '0 0 25px rgba(13, 148, 136, 0.4)',
              }}
            >
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#f1f5f9]">AI System Ready</p>
              <p className="text-sm text-[#64748b]">All models operational</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div 
            className="h-[420px] rounded-2xl overflow-hidden p-6"
            style={{
              background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-[#f1f5f9]">Processing Activity</h3>
                <p className="text-sm text-[#64748b]">Study analysis over time</p>
              </div>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 text-sm rounded-lg transition-all"
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                  }}
                >
                  Week
                </button>
                <button 
                  className="px-4 py-2 text-sm rounded-lg transition-all font-medium"
                  style={{
                    background: 'rgba(13, 148, 136, 0.15)',
                    color: '#14b8a6',
                    border: '1px solid rgba(13, 148, 136, 0.3)',
                  }}
                >
                  Month
                </button>
              </div>
            </div>
            <ActivityChart />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div 
            className="h-[420px] rounded-2xl overflow-hidden p-6"
            style={{
              background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-[#fbbf24]" />
              <h3 className="text-lg font-semibold text-[#f1f5f9]">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <QuickActionButton key={action.label} {...action} index={index} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Studies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div 
          className="rounded-2xl overflow-hidden p-6"
          style={{
            background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#14b8a6]" />
              <h3 className="text-lg font-semibold text-[#f1f5f9]">Recent Studies</h3>
            </div>
            <Link 
              href="/studies"
              className="flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: '#14b8a6' }}
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <RecentStudies />
        </div>
      </motion.div>
    </div>
  );
}

interface QuickActionButtonProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  gradient: string;
  glow: string;
  index: number;
}

function QuickActionButton({ icon: Icon, label, description, href, gradient, glow, index }: QuickActionButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.1 }}
    >
      <Link
        href={href}
        className="flex items-center gap-4 p-4 rounded-xl transition-all group"
        style={{
          background: 'rgba(26, 39, 68, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(26, 39, 68, 0.8)';
          e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
          e.currentTarget.style.transform = 'translateX(4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(26, 39, 68, 0.5)';
          e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
          style={{
            background: gradient,
            boxShadow: `0 4px 15px ${glow}`,
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#f1f5f9]">{label}</p>
          <p className="text-sm text-[#64748b] truncate">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-[#64748b] opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
