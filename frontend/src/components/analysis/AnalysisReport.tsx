import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Eye, 
  Ruler, 
  HelpCircle, 
  UserCheck, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { AIAnalysisReport } from '@/types/analysis';

export default function AnalysisReport({ report }: { report: AIAnalysisReport }) {
  const [viewMode, setViewMode] = useState<'clinician' | 'patient'>('clinician');

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-100 overflow-hidden">
      {/* View Toggle */}
      <div className="flex p-2 bg-slate-900/50 rounded-lg mx-4 mt-4 gap-1">
         <button 
           onClick={() => setViewMode('clinician')}
           className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${viewMode === 'clinician' ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:bg-slate-800'}`}
         >
            <Activity className="w-4 h-4" />
            Clinician View
         </button>
         <button 
           onClick={() => setViewMode('patient')}
           className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${viewMode === 'patient' ? 'bg-teal-600 shadow-md text-white' : 'text-slate-400 hover:bg-slate-800'}`}
         >
            <UserCheck className="w-4 h-4" />
            Patient Summary
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 1. Overview & Quality */}
        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <h4 className="text-xs uppercase text-slate-400 font-bold mb-2 flex items-center gap-2">
                 <FileText className="w-3 h-3" /> Scan Overview
              </h4>
              <p className="font-medium text-sm text-white">{report.overview.description}</p>
              <div className="mt-2 flex gap-2">
                 <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">{report.overview.modality}</span>
                 <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs">{report.overview.region}</span>
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
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              
              {/* 3. Findings */}
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                 <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-400">
                    <Eye className="w-5 h-5" /> AI Visual Observations
                 </h3>
                 <ul className="space-y-2">
                    {report.findings.visualObservations.map((obs, i) => (
                       <li key={i} className="flex gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                          {obs}
                       </li>
                    ))}
                 </ul>
              </div>

               {/* 4. Explainability */}
               <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                 <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-400">
                    <Activity className="w-5 h-5" /> Evaluation Explainability
                 </h3>
                 <ul className="space-y-2">
                    {report.findings.highlightedRegions.map((region, i) => (
                       <li key={i} className="flex gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                          {region}
                       </li>
                    ))}
                 </ul>
              </div>

              {/* 5. Measurements */}
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                 <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-400">
                    <Ruler className="w-5 h-5" /> Quantitative Metrics
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.measurements.data.map((metric, i) => (
                       <div key={i} className="p-2 bg-slate-900 rounded text-sm text-blue-300 font-mono">
                          {metric}
                       </div>
                    ))}
                 </div>
              </div>

              {/* 6. Confidence */}
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
              
              {/* 7. Patient Friendly */}
              <div className="p-5 rounded-xl bg-teal-500/10 border border-teal-500/30">
                 <h3 className="font-semibold mb-3 flex items-center gap-2 text-teal-400">
                    <UserCheck className="w-5 h-5" /> Patient Summary
                 </h3>
                 <p className="text-base leading-relaxed text-teal-100">
                    "{report.patientSupport.explanation}"
                 </p>
              </div>

              {/* 8. Next Steps */}
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

         {/* 9. Disclaimer */}
         <div className="mt-8 pt-4 border-t border-slate-800 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
               <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" /> Medical Disclaimer
            </p>
            <p className="text-[10px] text-slate-600 max-w-lg mx-auto leading-normal">
               {report.disclaimer}
            </p>
         </div>

      </div>
    </div>
  );
}
