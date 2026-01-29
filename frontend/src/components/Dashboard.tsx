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
  Users,
  Cpu
} from 'lucide-react';
import StatsCard from './ui/StatsCard';
import RecentStudies from './RecentStudies';
import ActivityChart from './charts/ActivityChart';

const stats: Array<{
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: typeof FileImage;
  color: string;
}> = [
  {
    title: 'Total Studies',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: FileImage,
    color: 'blue'
  },
  {
    title: 'Processed Today',
    value: '156',
    change: '+8.2%',
    trend: 'up',
    icon: CheckCircle2,
    color: 'green'
  },
  {
    title: 'Avg. Processing Time',
    value: '2.4s',
    change: '-15.3%',
    trend: 'up',
    icon: Clock,
    color: 'cyan'
  },
  {
    title: 'AI Accuracy',
    value: '94.7%',
    change: '+2.1%',
    trend: 'up',
    icon: TrendingUp,
    color: 'purple'
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome to <span className="gradient-text">MediVision AI</span>
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          AI-powered medical imaging analysis platform
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="card h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Processing Activity</h3>
              <div className="flex gap-2">
                <button className="btn btn-ghost text-sm">Week</button>
                <button className="btn btn-secondary text-sm">Month</button>
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
          <div className="card h-[400px]">
            <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <QuickActionButton
                icon={FileImage}
                label="Upload New Study"
                href="/upload"
                color="blue"
              />
              <QuickActionButton
                icon={Activity}
                label="View Recent Cases"
                href="/cases"
                color="green"
              />
              <QuickActionButton
                icon={Cpu}
                label="Run AI Analysis"
                href="/analyze"
                color="purple"
              />
              <QuickActionButton
                icon={AlertTriangle}
                label="Review Flagged"
                href="/flagged"
                color="yellow"
              />
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
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Studies</h3>
            <button className="btn btn-ghost text-sm">View All</button>
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
  href: string;
  color: string;
}

function QuickActionButton({ icon: Icon, label, href, color }: QuickActionButtonProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };

  return (
    <a
      href={href}
      className={`flex items-center gap-3 p-4 rounded-lg border transition-all hover:scale-[1.02] ${colorClasses[color]}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </a>
  );
}
