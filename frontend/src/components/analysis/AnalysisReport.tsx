import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Eye, 
  Ruler, 
  HelpCircle, 
  UserCheck, 
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Stethoscope,
  ClipboardList,
  Pill,
  FlaskConical,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { AIAnalysisReport, ClinicalFinding, MedicalRecommendation } from '@/types/analysis';

// Inline SVG Thumbnail Component (Guaranteed to Render)
function CTScanThumbnail() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="100%" height="100%" fill="#0f172a"/>
      <circle cx="100" cy="60" r="50" fill="#1e293b"/>
      <ellipse cx="100" cy="45" rx="20" ry="12" fill="#334155" opacity="0.6"/>
      <ellipse cx="75" cy="60" rx="12" ry="20" fill="#334155" opacity="0.4" transform="rotate(15 75 60)"/>
      <ellipse cx="125" cy="60" rx="12" ry="20" fill="#334155" opacity="0.4" transform="rotate(-15 125 60)"/>
      <circle cx="130" cy="50" r="4" fill="white" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="100" y="110" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="sans-serif">CT SCAN</text>
    </svg>
  );
}

function ReportSection({ title, icon: Icon, color, children, defaultOpen = true }: any) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
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
            <div className="p-4 text-sm text-slate-300 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Severity badge component
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

// Urgency badge component
function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { color: string, icon: any }> = {
    'Urgent': { color: 'text-red-400', icon: AlertCircle },
    'Routine': { color: 'text-blue-400', icon: Clock },
    'Optional': { color: 'text-slate-400', icon: CheckCircle }
  };
  const { color, icon: Icon } = config[urgency] || config['Routine'];
  return (
    <span className={`flex items-center gap-1 text-xs ${color}`}>
      <Icon className="w-3 h-3" />
      {urgency}
    </span>
  );
}

// Clinical Finding Card
function ClinicalFindingCard({ finding }: { finding: ClinicalFinding }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-white">{finding.name}</span>
              <SeverityBadge severity={finding.severity} />
            </div>
            <p className="text-xs text-slate-400">{finding.location}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-3 space-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Description</p>
                <p className="text-slate-300">{finding.description}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Clinical Significance</p>
                <p className="text-teal-300">{finding.clinicalSignificance}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Recommendation Card
function RecommendationCard({ recommendation, index }: { recommendation: MedicalRecommendation, index: number }) {
  const categoryColors: Record<string, string> = {
    'Immediate': 'bg-red-500/20 text-red-400',
    'Follow-Up': 'bg-blue-500/20 text-blue-400',
    'Preventive': 'bg-green-500/20 text-green-400',
    'Lifestyle': 'bg-purple-500/20 text-purple-400'
  };
  
  return (
    <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-3">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-400 flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[recommendation.category]}`}>
              {recommendation.category}
            </span>
            <UrgencyBadge urgency={recommendation.urgency} />
          </div>
          <p className="font-medium text-white text-sm mb-1">{recommendation.recommendation}</p>
          <p className="text-xs text-slate-400">{recommendation.rationale}</p>
        </div>
      </div>
    </div>
  );
}

interface AnalysisReportProps {
  report: AIAnalysisReport;
  imageUrl?: string;
}

export default function AnalysisReport({ report }: AnalysisReportProps) {
  const [viewMode, setViewMode] = useState<'clinician' | 'patient'>('clinician');
  const [showFullImage, setShowFullImage] = useState(false);

   return (
     <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 text-white p-4 overflow-y-auto">
       <div className="flex items-center justify-between mb-4">
         <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            AI Analysis Report
         </h2>
         <div className="flex gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button 
               onClick={() => setViewMode('clinician')}
               className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'clinician' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
               Clinician View
            </button>
            <button 
               onClick={() => setViewMode('patient')}
               className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'patient' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
               Patient View
            </button>
         </div>
       </div>

        {/* Overview Cards */}
        <div className="space-y-4 mb-4">
           <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
              <h4 className="text-xs uppercase text-slate-400 font-bold mb-3">Study Overview</h4>

              {/* Scan Thumbnail */}
              <div className="mb-3 rounded-lg overflow-hidden border border-slate-700 relative h-32 bg-black">
                {imageUrl && !imageUrl.startsWith('data:image/svg') ? (
                  <img src={imageUrl} alt="Scan Analysis" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <CTScanThumbnail />
                )}
                <button 
                  onClick={() => setShowFullImage(true)}
                  className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 hover:bg-black/90 rounded text-xs text-slate-300 transition-colors"
                >
                  <Maximize2 className="w-3 h-3" /> View Full
                </button>
              </div>

              {/* Fullscreen Modal for Scan */}
              <AnimatePresence>
                {showFullImage && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
                        onClick={() => setShowFullImage(false)}
                    >
                        <button 
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                            onClick={() => setShowFullImage(false)}
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        <div className="max-w-2xl max-h-[80vh] rounded-xl overflow-hidden border-2 border-slate-600 shadow-2xl bg-black">
                            {imageUrl && !imageUrl.startsWith('data:image/svg') ? (
                              <img src={imageUrl} alt="Full Scan" className="w-full h-full object-contain" />
                            ) : (
                              <svg viewBox="0 0 512 512" className="w-full h-full">
                                  <rect width="100%" height="100%" fill="#0f172a"/>
                                  <circle cx="256" cy="256" r="200" fill="#1e293b"/>
                                  <ellipse cx="256" cy="180" rx="64" ry="40" fill="#334155" opacity="0.6"/>
                                  <ellipse cx="180" cy="256" rx="40" ry="64" fill="#334155" opacity="0.4" transform="rotate(15 180 256)"/>
                                  <ellipse cx="332" cy="256" rx="40" ry="64" fill="#334155" opacity="0.4" transform="rotate(-15 332 256)"/>
                                  <circle cx="345" cy="230" r="10" fill="white" opacity="0.9">
                                      <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>
                                  </circle>
                                  <text x="256" y="480" textAnchor="middle" fill="#64748b" fontSize="16" fontFamily="sans-serif">{report.overview.modality} - {report.overview.region}</text>
                              </svg>
                            )}
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>

              <p className="font-medium text-sm text-white">{report.overview.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                 <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">{report.overview.modality}</span>
                 <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs">{report.overview.region}</span>
                 {report.overview.technique && (
                   <span className="px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs">{report.overview.technique.split(',')[0]}</span>
                 )}
              </div>
           </div>
           
           <div className={`p-4 rounded-xl border ${report.quality.score === 'Good' ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
              <h4 className="text-xs uppercase text-slate-400 font-bold mb-2 flex items-center gap-2">
                 <ShieldCheck className="w-3 h-3" /> Quality Assessment
              </h4>
              <div className="flex items-baseline gap-2 mb-1">
                 <span className={`text-lg font-bold ${report.quality.score === 'Good' ? 'text-green-400' : 'text-yellow-400'}`}>{report.quality.score}</span>
                 <span className="text-xs text-slate-500">Confidence Impact: {report.quality.confidenceImpact}</span>
              </div>
              <p className="text-xs text-slate-400">{report.quality.details}</p>
           </div>
        </div>

        {viewMode === 'clinician' ? (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {/* Clinical Findings - NEW SECTION */}
              {report.findings.clinicalFindings && report.findings.clinicalFindings.length > 0 && (
                <ReportSection title="Clinical Findings" icon={Stethoscope} color="text-rose-400" defaultOpen={true}>
                  <div className="space-y-3">
                    {report.findings.clinicalFindings.map((finding, i) => (
                      <ClinicalFindingCard key={i} finding={finding} />
                    ))}
                  </div>
                </ReportSection>
              )}
              
              <ReportSection title="AI Visual Observations" icon={Eye} color="text-purple-400">
                 <ul className="space-y-2">
                    {report.findings.visualObservations.map((obs, i) => (
                       <li key={i} className="flex gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                          {obs}
                       </li>
                    ))}
                 </ul>
              </ReportSection>

              <ReportSection title="Evaluation Explainability" icon={Activity} color="text-orange-400">
                 <ul className="space-y-2">
                    {report.findings.highlightedRegions.map((region, i) => (
                       <li key={i} className="flex gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                          {region}
                       </li>
                    ))}
                 </ul>
              </ReportSection>

              <ReportSection title="Quantitative Metrics" icon={Ruler} color="text-blue-400">
                 <div className="grid grid-cols-1 gap-2">
                    {report.measurements.data.map((metric, i) => (
                       <div key={i} className="p-2 bg-slate-900 rounded text-sm text-blue-300 font-mono border border-slate-700/50">
                          {metric}
                       </div>
                    ))}
                 </div>
              </ReportSection>

              {/* Medical Suggestions - NEW SECTION */}
              {report.medicalSuggestions && (
                <ReportSection title="Medical Recommendations" icon={ClipboardList} color="text-teal-400" defaultOpen={true}>
                  <div className="space-y-3">
                    {report.medicalSuggestions.recommendations.map((rec, i) => (
                      <RecommendationCard key={i} recommendation={rec} index={i} />
                    ))}
                  </div>
                </ReportSection>
              )}

              {/* Differential Diagnosis - NEW SECTION */}
              {report.medicalSuggestions && report.medicalSuggestions.differentialDiagnosis.length > 0 && (
                <ReportSection title="Differential Diagnosis" icon={Pill} color="text-pink-400" defaultOpen={false}>
                  <ul className="space-y-2">
                    {report.medicalSuggestions.differentialDiagnosis.map((dx, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="w-5 h-5 rounded bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span>{dx}</span>
                      </li>
                    ))}
                  </ul>
                </ReportSection>
              )}

              {/* Additional Tests - NEW SECTION */}
              {report.medicalSuggestions && report.medicalSuggestions.additionalTests.length > 0 && (
                <ReportSection title="Recommended Additional Tests" icon={FlaskConical} color="text-cyan-400" defaultOpen={false}>
                  <ul className="space-y-2">
                    {report.medicalSuggestions.additionalTests.map((test, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                        <span>{test}</span>
                      </li>
                    ))}
                  </ul>
                </ReportSection>
              )}

               <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                 <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-400">
                    <HelpCircle className="w-5 h-5" /> Risk & Uncertainty
                 </h3>
                 <div className="flex items-center gap-4 mb-2">
                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                       <div className="bg-blue-500 h-full" style={{ width: `${report.uncertainty.confidenceScore * 100}%` }}></div>
                    </div>
                    <span className="text-sm font-bold">{Math.round(report.uncertainty.confidenceScore * 100)}%</span>
                 </div>
                 <p className="text-sm text-slate-400">{report.uncertainty.explanation}</p>
              </div>

           </motion.div>
        ) : (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* Patient Friendly */}
              <div className="p-5 rounded-xl bg-teal-500/10 border border-teal-500/30">
                 <h3 className="font-semibold mb-3 flex items-center gap-2 text-teal-400">
                    <UserCheck className="w-5 h-5" /> Patient Summary
                 </h3>
                 <p className="text-base leading-relaxed text-teal-100">
                    "{report.patientSupport.explanation}"
                 </p>
              </div>

              {/* Next Steps */}
               <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                 <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-300">
                    <ArrowRight className="w-5 h-5" /> Suggested Next Steps
                 </h3>
                 <ul className="space-y-3">
                    {report.patientSupport.nextSteps.map((step, i) => (
                       <li key={i} className="flex gap-3 text-sm text-slate-300">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">{i+1}</div>
                          <span className="pt-0.5">{step}</span>
                       </li>
                    ))}
                 </ul>
              </div>

           </motion.div>
        )}

         {/* Disclaimer */}
         <div className="mt-8 pt-4 border-t border-slate-800 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
               <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" /> Medical Disclaimer
            </p>
            <p className="text-[10px] text-slate-600 max-w-lg mx-auto leading-normal">
               {report.disclaimer}
            </p>
         </div>

      </div>
   );
}
