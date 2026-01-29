'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  FolderOpen,
  Search,
  Filter,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

const cases = [
  {
    id: 'CASE-001',
    patientId: 'MRN-45821',
    status: 'in_progress',
    studies: 2,
    modalities: ['CT', 'US'],
    createdAt: '2024-01-15',
    tags: ['urgent', 'follow-up'],
  },
  {
    id: 'CASE-002',
    patientId: 'MRN-45820',
    status: 'complete',
    studies: 1,
    modalities: ['CT'],
    createdAt: '2024-01-14',
    tags: ['routine'],
  },
  {
    id: 'CASE-003',
    patientId: 'MRN-45819',
    status: 'pending',
    studies: 3,
    modalities: ['CT', 'US'],
    createdAt: '2024-01-13',
    tags: [],
  },
];

const statusConfig = {
  pending: { color: 'yellow', icon: Clock, label: 'Pending' },
  in_progress: { color: 'blue', icon: AlertCircle, label: 'In Progress' },
  complete: { color: 'green', icon: CheckCircle2, label: 'Complete' },
};

export default function CasesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-2xl font-bold mb-2">Cases</h1>
              <p className="text-[var(--color-text-secondary)]">
                Manage patient cases and imaging studies
              </p>
            </div>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4" />
              New Case
            </button>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by case ID or patient MRN..."
                  className="input pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-secondary">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </motion.div>

          {/* Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((caseItem, index) => {
              const status = statusConfig[caseItem.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="card group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-[var(--color-accent-primary)]" />
                      </div>
                      <div>
                        <p className="font-medium">{caseItem.id}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {caseItem.patientId}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-white transition-colors" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Status</span>
                      <div className={clsx(
                        'flex items-center gap-1',
                        `text-${status.color}-400`
                      )}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Studies</span>
                      <span>{caseItem.studies}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Modalities</span>
                      <div className="flex gap-1">
                        {caseItem.modalities.map((mod) => (
                          <span
                            key={mod}
                            className={clsx(
                              'px-2 py-0.5 rounded text-xs',
                              mod === 'CT'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-cyan-500/10 text-cyan-400'
                            )}
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    </div>

                    {caseItem.tags.length > 0 && (
                      <div className="flex gap-1 pt-2 border-t border-[var(--color-border)]">
                        {caseItem.tags.map((tag) => (
                          <span
                            key={tag}
                            className={clsx(
                              'px-2 py-0.5 rounded text-xs',
                              tag === 'urgent'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
