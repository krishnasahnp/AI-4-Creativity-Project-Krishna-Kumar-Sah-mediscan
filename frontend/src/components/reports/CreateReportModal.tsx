import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Check, ChevronDown, Calendar, User, Activity } from 'lucide-react';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (reportData: any) => void;
}

export default function CreateReportModal({ isOpen, onClose, onCreate }: CreateReportModalProps) {
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    modality: 'CT',
    title: '',
    studyDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      id: `RPT-${Math.floor(Math.random() * 10000)}`,
      status: 'draft',
      signedBy: null,
      signedAt: null,
      findings: 'Draft report created.'
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                  <FileText className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">New Report</h2>
                  <p className="text-sm text-slate-400">Create a new imaging report</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Patient Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                      value={formData.patientName}
                      onChange={e => setFormData({...formData, patientName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">MRN / ID</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. MRN-12345"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                      value={formData.patientId}
                      onChange={e => setFormData({...formData, patientId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Modality</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-4 text-white appearance-none focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                        value={formData.modality}
                        onChange={e => setFormData({...formData, modality: e.target.value})}
                      >
                        <option value="CT">CT Scan</option>
                        <option value="MRI">MRI</option>
                        <option value="US">Ultrasound</option>
                        <option value="X-Ray">X-Ray</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Study Title</label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. CT Chest with Contrast"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold hover:shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Create Report
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
