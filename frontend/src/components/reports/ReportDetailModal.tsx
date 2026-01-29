'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  Calendar, 
  User, 
  FileSignature, 
  CheckCircle2,
  AlertTriangle 
} from 'lucide-react';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any; // Using any for simplicity with mock data, strictly typed in real app
}

export default function ReportDetailModal({ isOpen, onClose, report }: ReportDetailModalProps) {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
          >
            <div className="bg-[var(--color-bg-primary)] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col pointer-events-auto border border-[var(--color-border)] overflow-hidden">
              
              {/* Header */}
              <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)] print:hidden">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Medical Report</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">{report.id} • {report.modality}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print / Save PDF
                  </button>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible print-content" id="printable-report">
                
                {/* Print Header */}
                <div className="hidden print:block mb-8 border-b pb-4">
                  <h1 className="text-3xl font-bold text-black">MediVision AI</h1>
                  <p className="text-gray-500">Radiology Report</p>
                </div>

                {/* Patient Info Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 p-6 bg-[var(--color-bg-tertiary)]/30 rounded-xl print:bg-transparent print:p-0">
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Patient Name</p>
                    <p className="font-semibold text-lg">{report.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">MRN</p>
                    <p className="font-semibold text-lg">{report.patient}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Exam Date</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {report.signedAt || 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Referring Physician</p>
                    <p className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Dr. Sarah Williams
                    </p>
                  </div>
                </div>

                {/* Clinical Info */}
                <div className="space-y-8">
                  <section>
                    <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-3 border-b border-[var(--color-border)] pb-2">
                      Exam Description
                    </h3>
                    <p className="text-[var(--color-text-primary)] leading-relaxed">
                      {report.title}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-3 border-b border-[var(--color-border)] pb-2">
                      Clinical Indication
                    </h3>
                    <p className="text-[var(--color-text-primary)] leading-relaxed">
                      Patient presenting with symptoms requiring imaging evaluation. History of previous clear scans.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-3 border-b border-[var(--color-border)] pb-2">
                      Findings
                    </h3>
                    <div className="bg-[var(--color-bg-tertiary)]/20 p-4 rounded-lg print:bg-transparent print:p-0">
                      <p className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
                        {report.findings}
                        {'\n\n'}
                        Detailed structural analysis reveals normal anatomical alignment unless otherwise noted above. Soft tissues appear unremarkable. No evidence of acute fracture or dislocation.
                      </p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-3 border-b border-[var(--color-border)] pb-2">
                      Impression
                    </h3>
                    <div className={`p-4 rounded-lg border-l-4 ${
                      report.findings.toLowerCase().includes('normal') 
                        ? 'bg-green-500/5 border-green-500' 
                        : 'bg-yellow-500/5 border-yellow-500'
                    } print:bg-transparent print:border-l-0 print:p-0`}>
                      <p className="font-semibold text-lg">
                        {report.findings}
                        {report.findings.toLowerCase().includes('normal') 
                          ? ' - No acute abnormality.'
                          : ' - Correlate with clinical history.'
                        }
                      </p>
                    </div>
                  </section>
                </div>

                {/* Signature */}
                <div className="mt-12 pt-8 border-t-2 border-[var(--color-border)] print:border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      {report.signedBy ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-green-400 font-bold text-lg print:text-black">
                            <FileSignature className="w-5 h-5" />
                            Electronically Signed
                          </div>
                          <p className="font-semibold text-xl">{report.signedBy}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">Radiologist • ID #88421</p>
                          <p className="text-xs text-[var(--color-text-muted)]">Signed at: {report.signedAt}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-400 font-bold bg-yellow-500/10 px-4 py-2 rounded-lg inline-block print:text-black print:bg-transparent">
                          <AlertTriangle className="w-5 h-5" />
                          Preliminary Report - Not Signed
                        </div>
                      )}
                    </div>
                    
                    {/* QR Code Placeholder for Print */}
                    <div className="hidden print:block text-right">
                      <div className="w-24 h-24 bg-gray-100 border flex items-center justify-center text-xs text-center ml-auto">
                        Scan to verify
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-xs text-[var(--color-text-muted)] print:mt-auto print:absolute print:bottom-4 print:left-0 print:right-0">
                  <p>MediVision AI Platform • Confidential Medical Record</p>
                  <p>Page 1 of 1 • Generated {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
