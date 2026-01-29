'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  FileText,
  Search,
  Download,
  Eye,
  Pen,
  Check,
  Clock,
  AlertCircle,
  Plus,
  FileSignature,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import ReportDetailModal from '@/components/reports/ReportDetailModal';

const reports = [
  {
    id: 'RPT-001',
    studyId: 'STD-2847',
    patient: 'MRN-45821',
    patientName: 'John Smith',
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
    patientName: 'Sarah Johnson',
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
    patientName: 'Michael Davis',
    modality: 'CT',
    title: 'CT Head without Contrast',
    status: 'pending_signature',
    signedBy: null,
    signedAt: null,
    findings: 'No acute intracranial abnormality',
  },
  {
    id: 'RPT-004',
    studyId: 'STD-2844',
    patient: 'MRN-45818',
    patientName: 'Emily Wilson',
    modality: 'MRI',
    title: 'MRI Brain with Contrast',
    status: 'signed',
    signedBy: 'Dr. Priya Sharma',
    signedAt: '2024-01-14 10:15',
    findings: 'Normal study, no lesions',
  },
];

const statusConfig = {
  signed: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: Check, label: 'Signed' },
  draft: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Pen, label: 'Draft' },
  pending_signature: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Clock, label: 'Pending' },
  error: { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', icon: AlertCircle, label: 'Error' },
};

const modalityColors: Record<string, { bg: string; text: string }> = {
  CT: { bg: 'rgba(13, 148, 136, 0.15)', text: '#14b8a6' },
  US: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
  MRI: { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa' },
  'X-Ray': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
};

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenReport = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex" style={{ background: '#0c1222' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                }}
              >
                <FileSignature className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f5f9]">Reports</h1>
                <p className="text-[#94a3b8]">
                  {reports.length} reports • {reports.filter(r => r.status === 'pending_signature').length} pending signature
                </p>
              </div>
            </div>
            
            <button 
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)',
              }}
            >
              <Plus className="w-5 h-5" />
              New Report
            </button>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search reports by ID, patient, or title..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm transition-all"
                style={{
                  background: 'rgba(26, 39, 68, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  color: '#f1f5f9',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {['all', 'signed', 'draft', 'pending_signature'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                  style={{
                    background: statusFilter === status 
                      ? 'rgba(13, 148, 136, 0.2)' 
                      : 'rgba(26, 39, 68, 0.5)',
                    color: statusFilter === status ? '#14b8a6' : '#94a3b8',
                    border: statusFilter === status 
                      ? '1px solid rgba(13, 148, 136, 0.4)' 
                      : '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                >
                  {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Reports List - Card View for Mobile, Table for Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Desktop Table */}
            <div 
              className="hidden lg:block rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(148,163,184,0.1)]">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Report</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Modality</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Signed By</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report, index) => {
                      const status = statusConfig[report.status as keyof typeof statusConfig];
                      const StatusIcon = status.icon;
                      const modColor = modalityColors[report.modality] || modalityColors.CT;
                      
                      return (
                        <motion.tr
                          key={report.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.05 * index }}
                          className="border-b border-[rgba(148,163,184,0.08)] transition-all hover:bg-[rgba(148,163,184,0.05)]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(139, 92, 246, 0.15)' }}
                              >
                                <FileText className="w-6 h-6 text-[#a78bfa]" />
                              </div>
                              <div>
                                <p className="font-semibold text-[#f1f5f9]">{report.id}</p>
                                <p className="text-sm text-[#64748b]">{report.title}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-[#f1f5f9]">{report.patientName}</p>
                              <p className="text-sm text-[#64748b]">{report.patient}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span 
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: modColor.bg, color: modColor.text }}
                            >
                              {report.modality}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                              style={{ background: status.bg, color: status.color }}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.label}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#94a3b8]">
                            {report.signedBy || <span className="text-[#64748b]">—</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleOpenReport(report)}
                                className="p-2.5 rounded-lg transition-all"
                                style={{ background: 'rgba(148, 163, 184, 0.1)' }}
                                title="View"
                              >
                                <Eye className="w-4 h-4 text-[#94a3b8]" />
                              </button>
                              <button 
                                onClick={() => handleOpenReport(report)}
                                className="p-2.5 rounded-lg transition-all"
                                style={{ background: 'rgba(148, 163, 184, 0.1)' }}
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4 text-[#94a3b8]" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredReports.map((report, index) => {
                const status = statusConfig[report.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                const modColor = modalityColors[report.modality] || modalityColors.CT;
                
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="rounded-2xl p-5"
                    style={{
                      background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                      border: '1px solid rgba(148, 163, 184, 0.12)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: 'rgba(139, 92, 246, 0.15)' }}
                        >
                          <FileText className="w-6 h-6 text-[#a78bfa]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#f1f5f9]">{report.id}</p>
                          <p className="text-sm text-[#64748b]">{report.title}</p>
                        </div>
                      </div>
                      <span 
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: modColor.bg, color: modColor.text }}
                      >
                        {report.modality}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                      style={{ background: status.bg, color: status.color }}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </div>

                    {/* Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-[#64748b]" />
                        <span className="text-[#94a3b8]">{report.patientName} ({report.patient})</span>
                      </div>
                      {report.signedBy && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileSignature className="w-4 h-4 text-[#64748b]" />
                          <span className="text-[#94a3b8]">{report.signedBy}</span>
                        </div>
                      )}
                      {report.signedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-[#64748b]" />
                          <span className="text-[#94a3b8]">{report.signedAt}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-[rgba(148,163,184,0.1)]">
                      <button 
                        onClick={() => handleOpenReport(report)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ 
                          background: 'rgba(13, 148, 136, 0.15)', 
                          color: '#14b8a6',
                          border: '1px solid rgba(13, 148, 136, 0.3)',
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button 
                        onClick={() => handleOpenReport(report)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{ 
                          background: 'rgba(148, 163, 184, 0.1)', 
                          color: '#94a3b8',
                          border: '1px solid rgba(148, 163, 184, 0.15)',
                        }}
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Empty State */}
          {filteredReports.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(148, 163, 184, 0.1)' }}
              >
                <FileText className="w-8 h-8 text-[#64748b]" />
              </div>
              <p className="text-[#94a3b8] mb-2">No reports found</p>
              <p className="text-sm text-[#64748b]">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </main>
        
        <ReportDetailModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          report={selectedReport} 
        />
      </div>
    </div>
  );
}
