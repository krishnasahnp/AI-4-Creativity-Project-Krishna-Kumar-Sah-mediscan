'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  Search,
  Filter,
  FileImage,
  Brain,
  Calendar,
  User,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Eye,
  ChevronDown,
  Activity,
  Archive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scan,
  Radio
} from 'lucide-react';
import clsx from 'clsx';

// Utility for safe color mapping
const colorStyles = {
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    hover: 'hover:bg-blue-500/20'
  },
  teal: {
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/20',
    icon: 'text-teal-400', 
    hover: 'hover:bg-teal-500/20'
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    hover: 'hover:bg-red-500/20'
  },
  gray: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/20',
    icon: 'text-gray-400',
    hover: 'hover:bg-gray-500/20'
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    hover: 'hover:bg-purple-500/20'
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    icon: 'text-orange-400',
    hover: 'hover:bg-orange-500/20'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-400',
    hover: 'hover:bg-yellow-500/20'
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    hover: 'hover:bg-green-500/20'
  }
};

// Mock Data
const ALL_STUDIES = [
  {
    id: 'STD-2847',
    patientName: 'Michael Davis',
    patientId: 'MRN-45821',
    modality: 'CT',
    description: 'CT Chest with Contrast',
    seriesCount: 4,
    instanceCount: 480,
    date: '2024-01-29',
    time: '10:30',
    status: 'complete',
    aiStatus: 'critical',
    finding: 'Pulmonary Nodule'
  },
  {
    id: 'STD-2846',
    patientName: 'Sarah Johnson',
    patientId: 'MRN-45820',
    modality: 'US',
    description: 'Abdominal Ultrasound',
    seriesCount: 1,
    instanceCount: 24,
    date: '2024-01-29',
    time: '09:45',
    status: 'processing',
    aiStatus: 'processing',
    finding: 'Analyzing...'
  },
  {
    id: 'STD-2845',
    patientName: 'Robert Wilson',
    patientId: 'MRN-45819',
    modality: 'MRI',
    description: 'Brain MRI - Stroke Protocol',
    seriesCount: 8,
    instanceCount: 1200,
    date: '2024-01-28',
    time: '16:20',
    status: 'complete',
    aiStatus: 'normal',
    finding: 'No acute findings'
  },
  {
    id: 'STD-2844',
    patientName: 'Emma Thompson',
    patientId: 'MRN-45818',
    modality: 'XR',
    description: 'Chest X-Ray PA/Lateral',
    seriesCount: 1,
    instanceCount: 2,
    date: '2024-01-28',
    time: '14:15',
    status: 'complete',
    aiStatus: 'warning',
    finding: 'Pneumonia suspected'
  },
  {
    id: 'STD-2843',
    patientName: 'James Anderson',
    patientId: 'MRN-45817',
    modality: 'CT',
    description: 'CT Abdomen/Pelvis',
    seriesCount: 3,
    instanceCount: 320,
    date: '2024-01-28',
    time: '11:00',
    status: 'archived',
    aiStatus: 'normal',
    finding: 'Normal'
  }
];

export default function StudiesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);

  const stats = [
    { label: 'Total Studies', value: '1,248', icon: FileImage, color: 'blue' },
    { label: 'Processing', value: '12', icon: Activity, color: 'teal' },
    { label: 'Critical', value: '5', icon: AlertTriangle, color: 'red' },
    { label: 'Archived', value: '840', icon: Archive, color: 'gray' },
  ];

  const filteredStudies = ALL_STUDIES.filter(study => {
    const matchesSearch = 
      study.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'critical') return matchesSearch && study.aiStatus === 'critical';
    if (activeFilter === 'processing') return matchesSearch && study.status === 'processing';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                  Study Worklist
                </h1>
                <p className="text-[var(--color-text-secondary)]">Manage and review imaging studies</p>
              </div>
              <button className="btn btn-primary self-start sm:self-auto">
                <Download className="w-4 h-4" />
                Export List
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                const styles = colorStyles[stat.color as keyof typeof colorStyles];
                
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card p-4 flex items-center gap-4"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.bg}`}>
                      <Icon className={`w-6 h-6 ${styles.text}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Filters & Search */}
            <div className="card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search patient, MRN, or study description..."
                  className="input pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <FilterButton 
                  active={activeFilter === 'all'} 
                  label="All Studies" 
                  onClick={() => setActiveFilter('all')} 
                />
                <FilterButton 
                  active={activeFilter === 'critical'} 
                  label="Critical Findings" 
                  count={5}
                  onClick={() => setActiveFilter('critical')} 
                  color="red"
                />
                <FilterButton 
                  active={activeFilter === 'processing'} 
                  label="Processing" 
                  count={12}
                  onClick={() => setActiveFilter('processing')} 
                  color="blue"
                />
              </div>
            </div>

            {/* Studies Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-muted)]">
                      <th className="p-4 font-medium">Study Details</th>
                      <th className="p-4 font-medium">Patient</th>
                      <th className="p-4 font-medium">Date & Time</th>
                      <th className="p-4 font-medium">Modality</th>
                      <th className="p-4 font-medium">AI Analysis</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filteredStudies.map((study) => (
                      <tr key={study.id} className="group hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                        <td className="p-4">
                          <Link href={`/studies/${study.id}`} className="block">
                            <p className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary-light)] transition-colors">
                              {study.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-1">
                              <span className="bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                                {study.seriesCount} Series
                              </span>
                              <span>•</span>
                              <span>{study.instanceCount} Images</span>
                            </div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-[var(--color-text-primary)]">{study.patientName}</p>
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-1">
                            <User className="w-3 h-3" />
                            {study.patientId}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-[var(--color-text-secondary)]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {study.date}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[var(--color-text-muted)]">
                              <Clock className="w-3.5 h-3.5" />
                              {study.time}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            type="modality" 
                            label={study.modality} 
                            color={getModalityColor(study.modality)} 
                          />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={study.aiStatus} label={study.finding} />
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/studies/${study.id}`}>
                              <button className="btn btn-ghost p-2 hover:bg-[var(--color-primary-glow)] text-[var(--color-primary-light)]" title="View Study">
                                <Eye className="w-4 h-4" />
                              </button>
                            </Link>
                            <button className="btn btn-ghost p-2 hover:text-blue-400" title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="btn btn-ghost p-2 hover:text-red-400" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}


function FilterButton({ active, label, count, onClick, color = 'teal' }: any) {
  const styles = colorStyles[color as keyof typeof colorStyles];
  
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2',
        active
          ? `${styles.bg} ${styles.text} border ${styles.border}`
          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-transparent hover:bg-[var(--color-bg-elevated)]'
      )}
    >
      {label}
      {count && (
        <span className={clsx(
          'px-1.5 py-0.5 rounded-full text-xs',
          active ? `bg-${color}-500/20` : 'bg-[var(--color-bg-primary)]'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

function Badge({ label, color, type }: any) {
  const styles = colorStyles[color as keyof typeof colorStyles];
  const isModality = type === 'modality';
  
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold',
      `${styles.bg} ${styles.text} border ${styles.border}`
    )}>
      {isModality && (label === 'CT' || label === 'MRI' ? <Scan className="w-3 h-3" /> : label === 'US' ? <Activity className="w-3 h-3" /> : <FileImage className="w-3 h-3" />)}
      {label}
    </span>
  );
}

function StatusBadge({ status, label }: any) {
  if (status === 'processing') {
    return (
      <div className="flex items-center gap-2 text-blue-400 text-sm">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        Processing...
      </div>
    );
  }

  const color = status === 'critical' ? 'red' : status === 'warning' ? 'yellow' : 'green';
  const styles = colorStyles[color as keyof typeof colorStyles];
  const Icon = status === 'critical' ? AlertTriangle : status === 'warning' ? AlertTriangle : CheckCircle2;

  return (
    <div className={clsx(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
      `${styles.bg} ${styles.text} border ${styles.border}`
    )}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}

function getModalityColor(modality: string) {
  switch (modality) {
    case 'CT': return 'blue';
    case 'MRI': return 'purple';
    case 'US': return 'teal';
    case 'XR': return 'orange';
    default: return 'gray';
  }
}
