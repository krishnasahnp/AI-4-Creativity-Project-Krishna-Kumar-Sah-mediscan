'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { generateAIAnalysis } from '@/services/mockAiService';
import { AIAnalysisReport } from '@/types/analysis';
import {
  FileText,
  ArrowLeft,
  Download,
  Printer,
  Calendar,
  User,
  FileSignature,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Stethoscope,
  Activity,
  Ruler,
  ClipboardList,
  Pill,
  FlaskConical,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Brain,
  Heart,
  Shield,
  Sparkles,
  Info,
  Target,
  TrendingUp,
  Image
} from 'lucide-react';
import VisualReportSection from '@/components/reports/VisualReportSection';

// Mock reports data with modality info for AI analysis
const reportsData: Record<string, any> = {
  'RPT-001': {
    id: 'RPT-001',
    studyId: 'STD-2847',
    patient: 'MRN-45821',
    patientName: 'John Smith',
    patientAge: '58 years',
    patientGender: 'Male',
    modality: 'CT',
    bodyPart: 'Chest',
    title: 'CT Chest with Contrast',
    status: 'signed',
    signedBy: 'Dr. Rajesh Kumar',
    signedAt: '2024-01-15 14:30',
    referringPhysician: 'Dr. Sarah Williams',
    clinicalHistory: 'Persistent cough for 3 weeks, history of smoking (30 pack-years). Rule out malignancy.',
    technique: 'Helical CT with IV iodinated contrast (100mL Omnipaque 350), 1.25mm slice thickness',
  },
  'RPT-002': {
    id: 'RPT-002',
    studyId: 'STD-2846',
    patient: 'MRN-45820',
    patientName: 'Sarah Johnson',
    patientAge: '42 years',
    patientGender: 'Female',
    modality: 'Ultrasound',
    bodyPart: 'Abdomen',
    title: 'Thyroid Ultrasound',
    status: 'draft',
    signedBy: null,
    signedAt: null,
    referringPhysician: 'Dr. Michael Chen',
    clinicalHistory: 'Palpable thyroid nodule on physical exam. Evaluate for characteristics.',
    technique: 'High-frequency linear transducer (12-15 MHz), grayscale and color Doppler',
  },
  'RPT-003': {
    id: 'RPT-003',
    studyId: 'STD-2845',
    patient: 'MRN-45819',
    patientName: 'Michael Davis',
    patientAge: '35 years',
    patientGender: 'Male',
    modality: 'CT',
    bodyPart: 'Chest',
    title: 'CT Head without Contrast',
    status: 'pending_signature',
    signedBy: null,
    signedAt: null,
    referringPhysician: 'Dr. Jennifer Brown',
    clinicalHistory: 'New onset headaches, rule out intracranial pathology.',
    technique: 'Non-contrast helical CT, 5mm slice thickness',
  },
  'RPT-004': {
    id: 'RPT-004',
    studyId: 'STD-2844',
    patient: 'MRN-45818',
    patientName: 'Emily Wilson',
    patientAge: '28 years',
    patientGender: 'Female',
    modality: 'MRI',
    bodyPart: 'Brain',
    title: 'MRI Brain with Contrast',
    status: 'signed',
    signedBy: 'Dr. Priya Sharma',
    signedAt: '2024-01-14 10:15',
    referringPhysician: 'Dr. Robert Taylor',
    clinicalHistory: 'Episodes of visual disturbances and numbness. Evaluate for demyelinating disease.',
    technique: '3T MRI with T1, T2, FLAIR, DWI, and post-gadolinium sequences',
  },
};

// Collapsible section component
function ReportSection({ title, icon: Icon, color, children, defaultOpen = true }: any) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <h3 className={`font-semibold flex items-center gap-2 ${color}`}>
          <Icon className="w-5 h-5" /> {title}
        </h3>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700"
          >
            <div className="p-4 text-sm text-slate-300">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Severity badge
function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    'Normal': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Mild': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Moderate': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Severe': 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[severity] || colors['Normal']}`}>
      {severity}
    </span>
  );
}

// Urgency badge
function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { color: string, icon: any }> = {
    'Urgent': { color: 'text-red-400', icon: AlertCircle },
    'Routine': { color: 'text-blue-400', icon: Clock },
    'Optional': { color: 'text-slate-400', icon: CheckCircle }
  };
  const { color, icon: IconComponent } = config[urgency] || config['Routine'];
  return (
    <span className={`flex items-center gap-1 text-xs ${color}`}>
      <IconComponent className="w-3 h-3" />
      {urgency}
    </span>
  );
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisReport | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'ai'>('ai');

  useEffect(() => {
    const reportId = params.id as string;
    const reportData = reportsData[reportId];
    if (reportData) {
      setReport(reportData);
      // Generate AI analysis based on modality and body part
      const analysis = generateAIAnalysis(reportData.modality, reportData.bodyPart);
      setAiAnalysis(analysis);
    }
  }, [params.id]);

  if (!report || !aiAnalysis) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c1222' }}>
        <div className="animate-pulse text-slate-400">Loading report...</div>
      </div>
    );
  }

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    signed: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', label: 'Signed' },
    draft: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', label: 'Draft' },
    pending_signature: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'Pending Signature' },
  };

  const status = statusColors[report.status] || statusColors.draft;

  return (
    <div className="min-h-screen flex" style={{ background: '#0c1222' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Back Button & Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => router.push('/reports')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </button>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{report.title}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-400">{report.id}</span>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: status.bg, color: status.text }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all"
                  style={{ 
                    background: 'rgba(148, 163, 184, 0.1)', 
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                  }}
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all"
                  style={{ 
                    background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(13, 148, 136, 0.3)',
                  }}
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tab Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6"
          >
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'ai' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <Brain className="w-4 h-4" />
              AI Analysis Report
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'report' 
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg' 
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Clinical Report
            </button>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column - Patient Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="xl:col-span-1 space-y-4"
            >
              {/* Patient Card */}
              <div 
                className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                }}
              >
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Patient Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="text-white font-semibold text-lg">{report.patientName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">MRN</p>
                      <p className="text-slate-300">{report.patient}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Age/Sex</p>
                      <p className="text-slate-300">{report.patientAge}, {report.patientGender}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Info Card */}
              <div 
                className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                }}
              >
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Study Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Modality</p>
                    <p className="text-teal-400 font-semibold">{report.modality}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Referring Physician</p>
                    <p className="text-slate-300">{report.referringPhysician}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Study Date</p>
                    <p className="text-slate-300">{report.signedAt || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Technique</p>
                    <p className="text-slate-400 text-sm">{report.technique}</p>
                  </div>
                </div>
              </div>

              {/* Clinical History */}
              <div 
                className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                }}
              >
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Clinical History
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">{report.clinicalHistory}</p>
              </div>

              {/* Quality Assessment */}
              <div 
                className={`rounded-2xl p-5 ${
                  aiAnalysis.quality.score === 'Good' 
                    ? 'bg-green-500/5 border border-green-500/20' 
                    : 'bg-yellow-500/5 border border-yellow-500/20'
                }`}
              >
                <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Image Quality
                </h3>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-2xl font-bold ${aiAnalysis.quality.score === 'Good' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {aiAnalysis.quality.score}
                  </span>
                  <span className="text-xs text-slate-500">Confidence Impact: {aiAnalysis.quality.confidenceImpact}</span>
                </div>
                <p className="text-xs text-slate-400">{aiAnalysis.quality.details}</p>
              </div>

              {/* Signature */}
              {report.signedBy && (
                <div 
                  className="rounded-2xl p-5 bg-green-500/5 border border-green-500/20"
                >
                  <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                    <FileSignature className="w-5 h-5" />
                    Electronically Signed
                  </div>
                  <p className="text-white font-semibold text-lg">{report.signedBy}</p>
                  <p className="text-sm text-slate-400">Radiologist</p>
                  <p className="text-xs text-slate-500 mt-1">Signed: {report.signedAt}</p>
                </div>
              )}
            </motion.div>

            {/* Right Column - Report Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="xl:col-span-2"
            >
              <AnimatePresence mode="wait">
                {activeTab === 'ai' ? (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {/* AI Header */}
                    <div 
                      className="rounded-2xl p-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">AI-Powered Analysis Report</h2>
                      </div>
                      <p className="text-slate-300">{aiAnalysis.overview.description}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-slate-400">Confidence: <span className="text-white font-bold">{Math.round(aiAnalysis.uncertainty.confidenceScore * 100)}%</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-slate-400">Model: <span className="text-white">MediScan AI v2.0</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Report Outputs */}
                    <VisualReportSection modality={report.modality} />

                    {/* Clinical Findings */}
                    {aiAnalysis.findings.clinicalFindings && aiAnalysis.findings.clinicalFindings.length > 0 && (
                      <ReportSection title="Clinical Findings" icon={Stethoscope} color="text-rose-400" defaultOpen={true}>
                        <div className="space-y-4">
                          {aiAnalysis.findings.clinicalFindings.map((finding, i) => (
                            <div key={i} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-white text-lg">{finding.name}</span>
                                    <SeverityBadge severity={finding.severity} />
                                  </div>
                                  <p className="text-xs text-slate-400">{finding.location}</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-slate-500 uppercase font-medium mb-1">Description</p>
                                  <p className="text-slate-300">{finding.description}</p>
                                </div>
                                <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                                  <p className="text-xs text-teal-400 uppercase font-medium mb-1">Clinical Significance</p>
                                  <p className="text-teal-200">{finding.clinicalSignificance}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ReportSection>
                    )}

                    {/* AI Observations */}
                    <ReportSection title="AI Visual Observations" icon={Eye} color="text-purple-400">
                      <ul className="space-y-3">
                        {aiAnalysis.findings.visualObservations.map((obs, i) => (
                          <li key={i} className="flex gap-3 p-3 bg-slate-900/30 rounded-lg border border-slate-700/30">
                            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </ReportSection>

                    {/* Quantitative Metrics */}
                    <ReportSection title="Quantitative Metrics" icon={Ruler} color="text-blue-400">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiAnalysis.measurements.data.map((metric, i) => (
                          <div key={i} className="p-3 bg-slate-900 rounded-lg text-sm text-blue-300 font-mono border border-slate-700/50">
                            {metric}
                          </div>
                        ))}
                      </div>
                    </ReportSection>

                    {/* Medical Recommendations */}
                    {aiAnalysis.medicalSuggestions && (
                      <ReportSection title="Medical Recommendations" icon={ClipboardList} color="text-teal-400" defaultOpen={true}>
                        <div className="space-y-3">
                          {aiAnalysis.medicalSuggestions.recommendations.map((rec, i) => {
                            const categoryColors: Record<string, string> = {
                              'Immediate': 'bg-red-500/20 text-red-400 border-red-500/30',
                              'Follow-Up': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                              'Preventive': 'bg-green-500/20 text-green-400 border-green-500/30',
                              'Lifestyle': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            };
                            return (
                              <div key={i} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 flex-shrink-0">
                                    {i + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${categoryColors[rec.category]}`}>
                                        {rec.category}
                                      </span>
                                      <UrgencyBadge urgency={rec.urgency} />
                                    </div>
                                    <p className="font-medium text-white mb-1">{rec.recommendation}</p>
                                    <p className="text-sm text-slate-400">{rec.rationale}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ReportSection>
                    )}

                    {/* Differential Diagnosis */}
                    {aiAnalysis.medicalSuggestions && aiAnalysis.medicalSuggestions.differentialDiagnosis.length > 0 && (
                      <ReportSection title="Differential Diagnosis" icon={Pill} color="text-pink-400" defaultOpen={false}>
                        <ul className="space-y-2">
                          {aiAnalysis.medicalSuggestions.differentialDiagnosis.map((dx, i) => (
                            <li key={i} className="flex gap-3 items-start p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                              <span className="w-6 h-6 rounded bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                              <span className="text-slate-300">{dx}</span>
                            </li>
                          ))}
                        </ul>
                      </ReportSection>
                    )}

                    {/* Additional Tests */}
                    {aiAnalysis.medicalSuggestions && aiAnalysis.medicalSuggestions.additionalTests.length > 0 && (
                      <ReportSection title="Recommended Additional Tests" icon={FlaskConical} color="text-cyan-400" defaultOpen={false}>
                        <ul className="space-y-2">
                          {aiAnalysis.medicalSuggestions.additionalTests.map((test, i) => (
                            <li key={i} className="flex gap-3 items-start p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
                              <span className="mt-1 w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                              <span className="text-slate-300">{test}</span>
                            </li>
                          ))}
                        </ul>
                      </ReportSection>
                    )}

                    {/* AI Confidence */}
                    <ReportSection title="AI Confidence & Uncertainty" icon={HelpCircle} color="text-slate-400" defaultOpen={false}>
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full" style={{ width: `${aiAnalysis.uncertainty.confidenceScore * 100}%` }}></div>
                          </div>
                          <span className="text-lg font-bold text-white">{Math.round(aiAnalysis.uncertainty.confidenceScore * 100)}%</span>
                        </div>
                        <p className="text-slate-400">{aiAnalysis.uncertainty.explanation}</p>
                      </div>
                    </ReportSection>

                    {/* Disclaimer */}
                    <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs uppercase tracking-wider text-yellow-400 font-bold mb-1">Medical Disclaimer</p>
                          <p className="text-sm text-yellow-200/70">{aiAnalysis.disclaimer}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="clinical"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    {/* Clinical Report Content */}
                    <div 
                      className="rounded-2xl p-6"
                      style={{
                        background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                        border: '1px solid rgba(148, 163, 184, 0.12)',
                      }}
                    >
                      <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Clinical Impression</h3>
                      <div className="p-4 bg-teal-500/10 border-l-4 border-teal-500 rounded-r-lg">
                        <p className="text-lg font-semibold text-white">
                          {aiAnalysis.findings.clinicalFindings && aiAnalysis.findings.clinicalFindings.length > 0 
                            ? aiAnalysis.findings.clinicalFindings[0].name 
                            : 'No abnormalities detected'}
                        </p>
                        <p className="text-slate-400 mt-1">
                          {aiAnalysis.findings.clinicalFindings && aiAnalysis.findings.clinicalFindings.length > 0 
                            ? aiAnalysis.findings.clinicalFindings[0].clinicalSignificance
                            : 'Correlate with clinical history'}
                        </p>
                      </div>
                    </div>

                    <div 
                      className="rounded-2xl p-6"
                      style={{
                        background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                        border: '1px solid rgba(148, 163, 184, 0.12)',
                      }}
                    >
                      <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Detailed Findings</h3>
                      <div className="prose prose-invert max-w-none">
                        <ul className="space-y-2">
                          {aiAnalysis.findings.visualObservations.slice(0, 5).map((obs, i) => (
                            <li key={i} className="text-slate-300">{obs}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div 
                      className="rounded-2xl p-6"
                      style={{
                        background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                        border: '1px solid rgba(148, 163, 184, 0.12)',
                      }}
                    >
                      <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Recommendations</h3>
                      <ul className="space-y-3">
                        {aiAnalysis.patientSupport.nextSteps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
