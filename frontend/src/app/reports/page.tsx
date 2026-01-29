'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Pen,
  Check,
  Clock,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

const reports = [
  {
    id: 'RPT-001',
    studyId: 'STD-2847',
    patient: 'MRN-45821',
    modality: 'CT',
    title: 'CT Chest with Contrast',
    status: 'signed',
    signedBy: 'Dr. Rajesh Kumar',
    signedAt: '2024-01-15 14:30',
    findings: 'Pulmonary nodule detected in RLL',
  },
  {
    id: 'RPT-002',
    studyId: 'STD-2846',
    patient: 'MRN-45820',
    modality: 'US',
    title: 'Thyroid Ultrasound',
    status: 'draft',
    signedBy: null,
    signedAt: null,
    findings: 'Multiple thyroid nodules',
  },
  {
    id: 'RPT-003',
    studyId: 'STD-2845',
    patient: 'MRN-45819',
    modality: 'CT',
    title: 'CT Head without Contrast',
    status: 'pending_signature',
    signedBy: null,
    signedAt: null,
    findings: 'No acute intracranial abnormality',
  },
];

const statusConfig = {
  signed: { color: 'green', icon: Check, label: 'Signed' },
  draft: { color: 'yellow', icon: Pen, label: 'Draft' },
  pending_signature: { color: 'blue', icon: Clock, label: 'Pending' },
  error: { color: 'red', icon: AlertCircle, label: 'Error' },
};

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-bold mb-2">Reports</h1>
            <p className="text-[var(--color-text-secondary)]">
              View and manage radiology reports
            </p>
          </motion.div>

          {/* Filters */}
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
                  placeholder="Search reports..."
                  className="input pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
                <select
                  className="input w-40"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="signed">Signed</option>
                  <option value="draft">Draft</option>
                  <option value="pending_signature">Pending</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Reports List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-[var(--color-text-muted)]">
                    <th className="pb-3 font-medium">Report</th>
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Signed By</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredReports.map((report, index) => {
                    const status = statusConfig[report.status as keyof typeof statusConfig];
                    const StatusIcon = status.icon;
                    
                    return (
                      <motion.tr
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-[var(--color-accent-primary)]" />
                            </div>
                            <div>
                              <p className="font-medium">{report.id}</p>
                              <p className="text-[var(--color-text-muted)]">{report.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-[var(--color-text-secondary)]">
                          {report.patient}
                        </td>
                        <td className="py-4">
                          <span className={clsx(
                            'px-2 py-1 rounded text-xs font-medium',
                            report.modality === 'CT' 
                              ? 'bg-blue-500/10 text-blue-400' 
                              : 'bg-cyan-500/10 text-cyan-400'
                          )}>
                            {report.modality}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className={clsx(
                            'flex items-center gap-2',
                            `text-${status.color}-400`
                          )}>
                            <StatusIcon className="w-4 h-4" />
                            <span>{status.label}</span>
                          </div>
                        </td>
                        <td className="py-4 text-[var(--color-text-secondary)]">
                          {report.signedBy || '-'}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <button className="btn btn-ghost p-2" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="btn btn-ghost p-2" title="Download PDF">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
