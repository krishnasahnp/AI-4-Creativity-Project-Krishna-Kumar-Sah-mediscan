'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Book, 
  Upload, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Search,
  Keyboard,
  FileText
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-12 pb-12">
            
            {/* Header Section */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Documentation
              </h1>
              <p className="text-xl text-[var(--color-text-secondary)]">
                Welcome to MediScan AI. Learn how to use the platform to analyze medical imaging with advanced AI models.
              </p>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DocCard icon={Upload} title="Getting Started" desc="How to upload and manage cases" href="#getting-started" />
              <DocCard icon={Cpu} title="AI Analysis" desc="Understanding findings & confidence" href="#ai-analysis" />
              <DocCard icon={Keyboard} title="Shortcuts" desc="Viewer controls and hotkeys" href="#shortcuts" />
            </div>

            {/* Getting Started */}
            <section id="getting-started" className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-[var(--color-border)]">
                <Upload className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-semibold">Getting Started</h2>
              </div>
              <div className="prose prose-invert max-w-none space-y-4 text-[var(--color-text-secondary)]">
                <h3 className="text-lg font-medium text-white">1. Creating a Case</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Navigate to the <span className="text-blue-400">Upload</span> page from the sidebar.</li>
                  <li>Select <strong>New Patient Case</strong> to start a fresh record.</li>
                  <li>Enter the <strong>Patient Name</strong> and <strong>ID</strong> (MRN). If left blank, an anonymous ID will be generated.</li>
                  <li>Choose the <strong>Modality</strong> (e.g., CT, MRI) and body part.</li>
                  <li>Drag and drop your DICOM or image files and click <strong>Start Analysis</strong>.</li>
                </ul>

                <h3 className="text-lg font-medium text-white mt-6">2. Adding to Existing Case</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Select <strong>Add to Existing Case</strong> on the Upload page.</li>
                  <li>Choose the patient from the provided dropdown menu.</li>
                  <li>Upload the new scan files. This helps in maintaining a longitudinal record for the patient.</li>
                </ul>
              </div>
            </section>

             {/* AI Analysis */}
             <section id="ai-analysis" className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-[var(--color-border)]">
                <Cpu className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold">AI Analysis Findings</h2>
              </div>
              <p className="text-[var(--color-text-secondary)]">
                Our AI models automatically detect potential pathologies. Findings are categorized by urgency:
              </p>
               <div className="grid gap-4 mt-4">
                 <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <h4 className="font-bold text-red-400 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4" /> High Urgency
                    </h4>
                    <p className="text-sm mt-1 text-gray-400">Critical findings requiring immediate attention (e.g., Pneumothorax, Fracture).</p>
                 </div>
                 <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <h4 className="font-bold text-yellow-400 flex items-center gap-2">
                       <Activity className="w-4 h-4" /> Moderate Urgency
                    </h4>
                    <p className="text-sm mt-1 text-gray-400">Significant findings that should be reviewed soon (e.g., Nodule, Mass).</p>
                 </div>
              </div>
            </section>

            {/* AI Capabilities Breakdown */}
            <section id="capabilities" className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-[var(--color-border)]">
                 <Search className="w-6 h-6 text-pink-400" />
                 <h2 className="text-2xl font-semibold">What AI Can Analyze (Per Modality)</h2>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
                 <div>
                    <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                       🧠 CT Scan (Brain / Chest / Abdomen)
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                       <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">What AI Scans</h4>
                          <ul className="space-y-2 text-sm text-slate-300">
                             <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"/>Tissue density (HU values)</li>
                             <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"/>Shape abnormalities</li>
                             <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"/>Symmetry/asymmetry</li>
                             <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"/>Size & volume of regions</li>
                          </ul>
                       </div>

                       <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">What AI Detects</h4>
                          <ul className="space-y-2 text-sm text-slate-300">
                             <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"/>Abnormal regions (lesion, bleed, consolidation)</li>
                             <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"/>Approximate location (L/R, Upper/Lower)</li>
                             <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"/>Change across slices</li>
                             <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"/>Data quality issues (motion blur)</li>
                          </ul>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-700">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-green-400 mb-3">Delivered Outputs</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       <span className="bg-slate-900 rounded px-3 py-2 text-xs text-center border border-slate-700">Highlights (Mask/Heatmap)</span>
                       <span className="bg-slate-900 rounded px-3 py-2 text-xs text-center border border-slate-700">Measurements (mm, cc)</span>
                       <span className="bg-slate-900 rounded px-3 py-2 text-xs text-center border border-slate-700">Confidence Score</span>
                       <span className="bg-slate-900 rounded px-3 py-2 text-xs text-center border border-slate-700">Doctor-Style Explanation</span>
                    </div>
                 </div>
              </div>
            </section>

             {/* Viewer Shortcuts */}
             <section id="shortcuts" className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-[var(--color-border)]">
                <Keyboard className="w-6 h-6 text-green-400" />
                <h2 className="text-2xl font-semibold">Viewer Shortcuts</h2>
              </div>
              <div className="bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#0f172a] text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Shortcut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)] text-sm">
                        <tr><td className="px-6 py-3">Next Slice</td><td className="px-6 py-3 font-mono text-blue-400">Right / Down</td></tr>
                        <tr><td className="px-6 py-3">Previous Slice</td><td className="px-6 py-3 font-mono text-blue-400">Left / Up</td></tr>
                        <tr><td className="px-6 py-3">Zoom In</td><td className="px-6 py-3 font-mono text-blue-400">+</td></tr>
                        <tr><td className="px-6 py-3">Zoom Out</td><td className="px-6 py-3 font-mono text-blue-400">-</td></tr>
                        <tr><td className="px-6 py-3">Reset View</td><td className="px-6 py-3 font-mono text-blue-400">R</td></tr>
                        <tr><td className="px-6 py-3">Play/Pause</td><td className="px-6 py-3 font-mono text-blue-400">Space</td></tr>
                    </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

function DocCard({ icon: Icon, title, desc, href }: any) {
    return (
        <a href={href} className="p-6 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent-primary)] hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Icon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-[var(--color-text-muted)]">{desc}</p>
        </a>
    )
}
