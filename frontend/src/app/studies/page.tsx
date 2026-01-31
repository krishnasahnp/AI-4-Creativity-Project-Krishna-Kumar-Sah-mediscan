'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  Search,
  FileImage,
  Calendar,
  User,
  Download,
  Trash2,
  Eye,
  Activity,
  Archive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scan,
} from 'lucide-react';
import clsx from 'clsx';
import { studyService, Study } from '@/services/studyService';

// Utility for safe color mapping
// ... (keep colorStyles as is or move to utility)
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

export default function StudiesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const data = await studyService.getStudies({
        search: searchQuery,
        modality: activeFilter !== 'all' && activeFilter !== 'critical' && activeFilter !== 'processing' ? activeFilter.toUpperCase() : '',
      });
      setStudies(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, [searchQuery, activeFilter]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this study? This cannot be undone.')) {
        await studyService.deleteStudy(id);
        fetchStudies();
    }
  };

  const stats = [
    { label: 'Total Studies', value: total.toString(), icon: FileImage, color: 'blue' },
    { label: 'Processing', value: '0', icon: Activity, color: 'teal' }, // Placeholder
    { label: 'Critical', value: '0', icon: AlertTriangle, color: 'red' }, // Placeholder
    { label: 'Archived', value: '0', icon: Archive, color: 'gray' }, // Placeholder
  ];

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
                
                 {/* Modality Filters - Simulating them as dynamic filters */}
                 <FilterButton 
                  active={activeFilter === 'ct'} 
                  label="CT Scans" 
                  onClick={() => setActiveFilter('ct')} 
                  color="blue"
                />
                <FilterButton 
                  active={activeFilter === 'mri'} 
                  label="MRI" 
                  onClick={() => setActiveFilter('mri')} 
                  color="purple"
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
                    {loading ? (
                         <tr><td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">Loading studies...</td></tr>
                    ) : studies.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">No studies found.</td></tr>
                    ) : (
                        studies.map((study) => (
                        <tr key={study.id} className="group hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                            <td className="p-4">
                            <Link href={`/studies/${study.id}`} className="block">
                                <p className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary-light)] transition-colors">
                                {study.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-1">
                                <span className="bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                                    {study.series_count} Series
                                </span>
                                <span>•</span>
                                <span>{study.image_count} Images</span>
                                </div>
                            </Link>
                            </td>
                            <td className="p-4">
                            <p className="font-medium text-[var(--color-text-primary)]">{study.patient.patient_name || 'Unknown'}</p>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-1">
                                <User className="w-3 h-3" />
                                {study.patient.patient_id}
                            </div>
                            </td>
                            <td className="p-4">
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(study.study_date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 text-[var(--color-text-muted)]">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(study.study_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                            <StatusBadge status={"normal"} label={"Analyzed"} />
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
                                <button 
                                    className="btn btn-ghost p-2 hover:text-red-400" 
                                    title="Delete"
                                    onClick={() => handleDelete(study.id)}
                                >
                                <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            </td>
                        </tr>
                        ))
                    )}
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
