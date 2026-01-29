'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useCases } from '@/context/CasesContext';
import toast from 'react-hot-toast';
import {
  Brain,
  Zap,
  Activity,
  Scan,
  FileImage,
  CheckCircle2,
  Clock,
  Play,
  Settings,
  Database
} from 'lucide-react';
import clsx from 'clsx';

// Mock Models Data
const AI_MODELS = [
  {
    id: 'lung-ct',
    name: 'Lung Nodule Detection',
    description: 'Detects and characterises pulmonary nodules in chest CT scans.',
    accuracy: '98.2%',
    latency: '< 2min',
    icon: Activity,
    color: 'teal'
  },
  {
    id: 'brain-mri',
    name: 'Brain Tumor Segmentation',
    description: 'Volumetric segmentation of gliomas and metastases in MRI.',
    accuracy: '96.5%',
    latency: '~ 5min',
    icon: Brain,
    color: 'purple'
  },
  {
    id: 'cxr-pathology',
    name: 'CXR Pathology Screen',
    description: 'Screens for pneumonia, pneumothorax, and pleural effusion.',
    accuracy: '94.8%',
    latency: '< 30s',
    icon: FileImage,
    color: 'blue'
  },
  {
    id: 'bone-fracture',
    name: 'Bone Fracture Detection',
    description: 'Identifies fractures in X-Ray images of extremities.',
    accuracy: '97.1%',
    latency: '< 45s',
    icon: Scan,
    color: 'orange'
  }
];

export default function AnalyzePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>('lung-ct');
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);
  
  const { cases, updateCaseStatus } = useCases();
  const router = useRouter();

  // Filter pending cases
  const pendingCases = cases.filter(c => c.status === 'pending' || (c.status === 'in_progress' && !c.aiFindings));

  const handleRunAnalysis = async (caseId: string) => {
    if (!selectedModel) {
      toast.error('Please select an AI model first');
      return;
    }

    setAnalyzingIds(prev => [...prev, caseId]);
    updateCaseStatus(caseId, 'in_progress');
    toast.loading('Analyzing...', { id: 'analyze-toast' });

    // Simulate AI Processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    updateCaseStatus(caseId, 'complete');
    setAnalyzingIds(prev => prev.filter(id => id !== caseId));
    toast.success('Analysis Complete', { id: 'analyze-toast' });
    
    // Redirect to viewer
    router.push(`/studies/${caseId}`);
  };

  // Safe color utilities
  const colorStyles = {
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
                AI Analysis Hub
              </h1>
              <p className="text-[var(--color-text-secondary)]">Select an AI model and run analysis on imaging studies</p>
            </div>

            {/* AI Models Grid */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Available Models
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {AI_MODELS.map((model) => {
                  const styles = colorStyles[model.color as keyof typeof colorStyles];
                  const Icon = model.icon;
                  const isSelected = selectedModel === model.id;

                  return (
                    <motion.div
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      whileHover={{ y: -4 }}
                      className={clsx(
                        'card p-5 cursor-pointer transition-all relative overflow-hidden group',
                        isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
                      )}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.bg} mb-4`}>
                        <Icon className={`w-6 h-6 ${styles.text}`} />
                      </div>
                      <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">{model.name}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-4 h-10">{model.description}</p>
                      
                      <div className="flex items-center justify-between text-xs pt-4 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-1.5 text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {model.accuracy} Accuracy
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                          <Clock className="w-3.5 h-3.5" />
                          {model.latency}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-blue-500">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Pending Analysis & Active Jobs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Pending Queue */}
              <section className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    Pending Analysis
                  </h2>
                  <Link href="/studies" className="text-sm text-blue-400 hover:text-blue-300">View All</Link>
                </div>
                
                <div className="card divide-y divide-[var(--color-border)] max-h-[400px] overflow-auto">
                  {pendingCases.length > 0 ? (
                    pendingCases.map((study) => (
                      <div key={study.id} className="p-4 flex items-center justify-between group hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                            {study.modalities.includes('US') ? <Activity className="w-5 h-5 text-teal-400" /> : <Scan className="w-5 h-5 text-orange-400" />}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)]">{study.patientName}</p>
                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                               <span>{study.id}</span>
                               <span>•</span>
                               <span>{study.modalities.join(', ')}</span>
                               <span>•</span>
                               <span>{study.status}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleRunAnalysis(study.id)}
                          disabled={analyzingIds.includes(study.id)}
                          className={`btn btn-sm transition-all ${analyzingIds.includes(study.id) ? 'btn-ghost opacity-50 cursor-wait' : 'btn-secondary group-hover:btn-primary'}`}
                        >
                          {analyzingIds.includes(study.id) ? (
                            <div className="flex items-center gap-2">
                               <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                               <span>Processing...</span>
                            </div>
                          ) : (
                            <>
                               <Play className="w-3.5 h-3.5 mr-1.5" />
                               Run Analysis
                            </>
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                       <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                       </div>
                       <p className="text-[var(--color-text-primary)] font-medium">All caught up!</p>
                       <p className="text-sm text-[var(--color-text-muted)] mt-1">No pending studies found.</p>
                       <Link href="/upload" className="inline-block mt-4 text-sm text-teal-400 hover:text-teal-300">
                          Upload new study &rarr;
                       </Link>
                    </div>
                  )}
                </div>
              </section>

              {/* Right Column: System Resource Status */}
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  System Load
                </h2>
                
                <div className="card p-5 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">GPU Utilization</span>
                      <span className="text-green-400 text-sm">32%</span>
                    </div>
                    <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '32%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Queue Depth</span>
                      <span className="text-blue-400 text-sm">{pendingCases.length} Jobs</span>
                    </div>
                    <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(pendingCases.length * 10, 100)}%` }} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <button className="w-full btn btn-secondary flex items-center justify-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configure Engines
                    </button>
                  </div>
                </div>
              </section>
            </div>

          </motion.div>
        </main>
      </div>
    </div>
  );
}
