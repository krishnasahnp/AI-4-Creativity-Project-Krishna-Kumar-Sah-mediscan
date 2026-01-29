'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FolderOpen,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Activity,
  Layers,
  ArrowUpRight,
  AlertCircle,
  X,
  Save,
} from 'lucide-react';
import { useCases } from '@/context/CasesContext';
import AuthGuard from '@/components/auth/AuthGuard';

const statusConfig = {
  pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock, label: 'Pending' },
  in_progress: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Activity, label: 'In Progress' },
  complete: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle2, label: 'Complete' },
};

const modalityColors: Record<string, { bg: string; text: string }> = {
  CT: { bg: 'rgba(13, 148, 136, 0.15)', text: '#14b8a6' },
  US: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
  MRI: { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa' },
  'X-Ray': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
};

function CasesContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const searchParams = useSearchParams();
  
  // Use Global Context
  const { cases, addCase } = useCases();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    patientName: '',
    patientId: '',
    modality: 'CT',
    isUrgent: false
  });

  // Sync param to filter
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter) {
      setFilterStatus(filter);
    }
  }, [searchParams]);

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCase.patientName || !newCase.patientId) return;

    const caseId = `CASE-${String(cases.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newCaseEntry = {
      id: caseId,
      patientId: newCase.patientId,
      patientName: newCase.patientName,
      status: 'pending' as const,
      studies: 0,
      modalities: [newCase.modality],
      createdAt: today,
      aiFindings: 0,
      tags: newCase.isUrgent ? ['urgent'] : [],
      scans: [] // Initialize empty scans array
    };

    addCase(newCaseEntry);
    setIsModalOpen(false);
    setNewCase({ patientName: '', patientId: '', modality: 'CT', isUrgent: false });
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'urgent') {
        matchesStatus = c.tags.includes('urgent');
    } else if (filterStatus !== 'all') {
        matchesStatus = c.status === filterStatus;
    }
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AuthGuard>
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
                  background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
                }}
              >
                <FolderOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f5f9]">Patient Cases</h1>
                <p className="text-[#94a3b8]">
                  {cases.length} cases • {cases.filter(c => c.status === 'in_progress').length} in progress
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)',
              }}
            >
              <Plus className="w-5 h-5" />
              New Case
            </button>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
              <input
                type="text"
                placeholder="Search by case ID, patient name, or MRN..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm transition-all text-white placeholder-slate-500"
                style={{
                  background: 'rgba(26, 39, 68, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {['all', 'pending', 'in_progress', 'complete', 'urgent'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all capitalize"
                  style={{
                    background: filterStatus === status 
                      ? 'rgba(13, 148, 136, 0.2)' 
                      : 'rgba(26, 39, 68, 0.5)',
                    color: filterStatus === status ? '#14b8a6' : '#94a3b8',
                    border: filterStatus === status 
                      ? '1px solid rgba(13, 148, 136, 0.4)' 
                      : '1px solid rgba(148, 163, 184, 0.1)',
                  }}
                >
                  {status === 'all' ? 'All Cases' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredCases.map((caseItem, index) => {
              const status = statusConfig[caseItem.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Link
                    href={`/studies/${caseItem.id}`}
                    className="block rounded-2xl p-5 sm:p-6 transition-all group cursor-pointer"
                    style={{
                      background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                      border: '1px solid rgba(148, 163, 184, 0.12)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.12)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: status.bg }}
                        >
                          <StatusIcon className="w-6 h-6" style={{ color: status.color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#f1f5f9]">{caseItem.id}</p>
                          <p className="text-sm text-[#64748b]">{caseItem.patientName}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-[#64748b] opacity-0 group-hover:opacity-100 transition-all" />
                    </div>

                    {/* Status Badge */}
                    <div 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                      style={{ 
                        background: status.bg,
                        color: status.color,
                        border: `1px solid ${status.color}30`,
                      }}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                          <User className="w-4 h-4" />
                          <span>{caseItem.patientId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                          <Calendar className="w-4 h-4" />
                          <span>{caseItem.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                          <Layers className="w-4 h-4" />
                          <span>{caseItem.studies} studies</span>
                        </div>
                        {caseItem.aiFindings > 0 && (
                          <div 
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                            style={{
                              background: 'rgba(244, 63, 94, 0.15)',
                              color: '#fb7185',
                            }}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            {caseItem.aiFindings} findings
                          </div>
                        )}
                      </div>

                      {/* Modalities */}
                      <div className="flex gap-2 pt-3 border-t border-[rgba(148,163,184,0.1)]">
                        {caseItem.modalities.map((mod) => {
                          const modColor = modalityColors[mod] || modalityColors.CT;
                          return (
                            <span
                              key={mod}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={{
                                background: modColor.bg,
                                color: modColor.text,
                                }}
                            >
                              {mod}
                            </span>
                          );
                        })}
                        
                        {/* Tags */}
                        {caseItem.tags.includes('urgent') && (
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold ml-auto"
                            style={{
                              background: 'rgba(244, 63, 94, 0.15)',
                              color: '#fb7185',
                            }}
                          >
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* New Case Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <>
                 <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   exit={{ opacity: 0 }}
                   onClick={() => setIsModalOpen(false)}
                   className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                 />
                 <motion.div
                   initial={{ opacity: 0, scale: 0.95, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 20 }}
                   className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
                 >
                   <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
                     {/* Modal Header */}
                     <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-[#1e293b]/50">
                        <h2 className="text-xl font-bold text-white">Create New Patient Case</h2>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                     </div>

                     {/* Modal Body */}
                     <form onSubmit={handleCreateCase} className="p-6 space-y-4 overflow-y-auto">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Patient Name</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                            placeholder="e.g. Jane Doe"
                            value={newCase.patientName}
                            onChange={(e) => setNewCase({...newCase, patientName: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Patient ID (MRN)</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                            placeholder="e.g. MRN-55501"
                            value={newCase.patientId}
                            onChange={(e) => setNewCase({...newCase, patientId: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Primary Modality</label>
                          <select 
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors appearance-none"
                            value={newCase.modality}
                            onChange={(e) => setNewCase({...newCase, modality: e.target.value})}
                          >
                             <option value="CT">CT Scan</option>
                             <option value="MRI">MRI</option>
                             <option value="US">Ultrasound</option>
                             <option value="X-Ray">X-Ray</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                           <input 
                              type="checkbox" 
                              id="urgent"
                              checked={newCase.isUrgent}
                              onChange={(e) => setNewCase({...newCase, isUrgent: e.target.checked})}
                              className="w-5 h-5 rounded border-slate-600 text-teal-500 focus:ring-teal-500 bg-[#1e293b]"
                            />
                           <label htmlFor="urgent" className="text-sm font-medium text-slate-300">Mark as Urgent Case</label>
                        </div>

                        <div className="pt-4 flex gap-3">
                           <button 
                             type="button"
                             onClick={() => setIsModalOpen(false)}
                             className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                           >
                             Cancel
                           </button>
                           <button 
                             type="submit"
                             className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                           >
                             <Save className="w-4 h-4" />
                             Create Case
                           </button>
                        </div>
                     </form>
                   </div>
                 </motion.div>
              </>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
    </AuthGuard>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-text-secondary)]">Loading cases...</div>}>
      <CasesContent />
    </Suspense>
  );
}
