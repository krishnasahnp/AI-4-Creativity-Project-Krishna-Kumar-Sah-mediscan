'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ImageViewer from '@/components/viewer/ImageViewer';
import ConsentModal from '@/components/ui/ConsentModal';
import { useKeyboardShortcuts, getViewerShortcuts, KeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';
import {
  Brain,
  FileText,
  MessageSquare,
  Check,
  AlertTriangle,
  TrendingUp,
  Activity,
  Microscope,
} from 'lucide-react';
import { useCases, Scan } from '@/context/CasesContext';

// --- Clinical Data Generators ---

const generateClinicalData = (modality: string | null, bodyPart: string | null) => {
  const mod = modality?.toUpperCase() || 'CT';
  const part = bodyPart || 'Chest';
  
  // Default Template
  let data = {
    metadata: { modality: mod, bodyPart: part, windowPreset: 'Default' },
    findings: [] as any[],
    report: {
      indication: 'Pain and swelling.',
      findings: 'No acute abnormality detected. Standard anatomical alignment preserved.',
      impression: 'Normal study.'
    }
  };

  // --- CT SCENARIOS ---
  if (mod === 'CT') {
    if (part.includes('Chest')) {
      data.metadata.windowPreset = 'Lung';
      data.findings = [
        { id: 1, label: 'Pulmonary Nodule', confidence: 0.92, location: 'RLL', size: '12mm', urgency: 'high' },
        { id: 2, label: 'Emphysema', confidence: 0.85, location: 'Apical', size: 'Diff', urgency: 'medium' }
      ];
      data.report = {
        indication: 'Evaluation of chronic cough and weight loss.',
        findings: 'LUNGS: 12mm spiculated nodule in the right lower lobe (RLL). Centrilobular emphysema noted in upper lobes. No pneumothorax or pleural effusion.\nMEDIASTINUM: No significant lymphadenopathy. Heart size within normal limits.\nBONES: No aggressive osseous lesions.',
        impression: '1. Suspicious 12mm RLL nodule, highly concerning for malignancy (Lung-RADS 4B).\n2. Background emphysematous changes.'
      };
    } else if (part.includes('Head') || part.includes('Brain')) {
        data.metadata.windowPreset = 'Bone/Soft Tissue';
        data.findings = [
            { id: 1, label: 'No Hemorrhage', confidence: 0.99, location: 'Intracranial', size: 'N/A', urgency: 'low' }
        ];
        data.report = {
            indication: 'Worst headache of life, rule out SAH.',
            findings: 'BRAIN: No acute intracranial hemorrhage, mass effect, or midline shift. Gray-white matter differentiation is preserved. No hydrocephalus.\nVESSELS: Hyperdense vessel sign absent.\nSKULL: No calvarial fracture.',
            impression: '1. Negative for acute intracranial hemorrhage.\n2. No acute territorial infarct.'
        };
    }
  } 
  
  // --- MRI SCENARIOS ---
  else if (mod === 'MRI') {
    if (part.includes('Brain') || part.includes('Head')) {
      data.metadata.windowPreset = 'T2/FLAIR';
      // Randomize or combine Mass Effect + White Matter for demo richness
      data.findings = [
        { id: 1, label: 'White Matter Lesions', confidence: 0.89, location: 'Periventricular', size: 'Multiple', urgency: 'medium' },
        { id: 2, label: 'Mass Effect', confidence: 0.65, location: 'None', size: 'N/A', urgency: 'low' }
      ];
      data.report = {
        indication: 'Multiple sclerosis protocol.',
        findings: 'BRAIN PARENCHYMA: Multiple ovoid T2/FLAIR hyperintense lesions oriented perpendicular to the ventricles (Dawson fingers). No enhancing active lesions.\nEXTRA-AXIAL SPACES: Normal.\nDIFFUSION: No restricted diffusion.',
        impression: '1. Multiple periventricular and subcortical white matter lesions consistent with demyelinating disease (Multiple Sclerosis).\n2. No active enhancing plaque.'
      };
    }
  }
  
  // --- ULTRASOUND SCENARIOS ---
  else if (mod === 'ULTRASOUND') {
    if (part.includes('Abdomen')) {
      data.findings = [
        { id: 1, label: 'Hepatic Steatosis', confidence: 0.94, location: 'Liver', size: 'Diffuse', urgency: 'medium' },
        { id: 2, label: 'Cholelithiasis', confidence: 0.88, location: 'Gallbladder', size: 'Multiple', urgency: 'medium' }
      ];
      data.report = {
        indication: 'Elevated liver enzymes and RUQ pain.',
        findings: 'LIVER: Diffusely increased echogenicity consistent with fatty infiltration (steatosis). No focal masses.\nGALLBLADDER: Multiple mobile shadowing echogenic calculi. Gallbladder wall is not thickened (2mm). Negative sonographic Murphy sign.\nBILE DUCTS: CBD measures 4mm (normal).',
        impression: '1. Moderate hepatic steatosis.\n2. Cholelithiasis without sonographic evidence of acute cholecystitis.'
      };
    }
  }
  
  // --- X-RAY SCENARIOS ---
  else if (mod === 'XRAY') {
    if (part.includes('Chest')) {
      data.findings = [
        { id: 1, label: 'Pneumonia', confidence: 0.89, location: 'RLL', size: 'Lobar', urgency: 'high' },
        { id: 2, label: 'Cardiomegaly', confidence: 0.82, location: 'Heart', size: 'Mod', urgency: 'medium' }
      ];
      data.report = {
        indication: 'Shortness of breath and fever.',
        findings: 'LUNGS: Focal airspace opacity in the right lower lobe with potential air bronchograms. Left lung clear.\nHEART: Cardiac silhouette is enlarged (CTR > 0.5).\nPLEURA: Blunting of the right costophrenic angle suggesting small effusion.',
        impression: '1. Right lower lobe pneumonia.\n2. Cardiomegaly with mild pulmonary venous congestion.'
      };
    } else if (part.includes('Bone') || part.includes('Extremity')) {
      data.findings = [
        { id: 1, label: 'Fracture', confidence: 0.99, location: 'Distal Radius', size: 'Displaced', urgency: 'high' }
      ];
      data.report = {
        indication: 'Trauma after fall.',
        findings: 'BONES: Transverse fracture of the distal radial metaphysis with dorsal angulation and impaction. Ulnar styloid fracture also noted.\nSOFT TISSUE: Swelling at the wrist.',
        impression: '1. Colles fracture of the distal radius.\n2. Associated ulnar styloid avulsion.'
      };
    }
  }

  return data;
};

// --- Component ---

export default function StudyViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  
  const { cases } = useCases();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'findings' | 'report' | 'chat'>('findings');
  const [showConsent, setShowConsent] = useState(true);
  const [currentSlice, setCurrentSlice] = useState(60);
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  
  // Data State
  const [data, setData] = useState(generateClinicalData('CT', 'Chest'));

  const currentCase = cases.find(c => c.id === id);
  const currentScan = currentCase?.scans?.find(s => s.id === selectedScanId) || currentCase?.scans?.[0];

  useEffect(() => {
    if (currentCase) {
        // Default to first scan if none selected
        if (!selectedScanId && currentCase.scans?.length > 0) {
            setSelectedScanId(currentCase.scans[0].id);
        }
        
        // Generate data for current scan
        if (currentScan) {
            setData(generateClinicalData(currentScan.modality, currentScan.bodyPart));
        }
    } else {
        // Fallback for direct URL params (legacy support)
        const mod = searchParams.get('modality');
        const part = searchParams.get('bodyPart');
        if (mod || part) {
          setData(generateClinicalData(mod || 'CT', part || 'Chest'));
        }
    }
  }, [id, cases, selectedScanId, searchParams, currentCase, currentScan]);

  // Keyboard shortcuts
  const shortcuts = getViewerShortcuts({
    nextSlice: () => setCurrentSlice(s => Math.min(s + 1, 120)),
    prevSlice: () => setCurrentSlice(s => Math.max(s - 1, 1)),
    zoomIn: () => console.log('Zoom in'),
    zoomOut: () => console.log('Zoom out'),
    resetView: () => setCurrentSlice(60),
    toggleMask: () => {},
    toggleHeatmap: () => {},
    exportImage: () => window.print(),
    goToFirst: () => setCurrentSlice(1),
    goToLast: () => setCurrentSlice(120),
    play: () => {},
    increaseWindow: () => {},
    decreaseWindow: () => {},
  });
  useKeyboardShortcuts({ shortcuts, enabled: !showConsent });

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      <ConsentModal
        isOpen={showConsent}
        onAccept={() => setShowConsent(false)}
        onDecline={() => window.history.back()}
      />
      <KeyboardShortcutsHelp shortcuts={shortcuts} />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 overflow-hidden">
          {/* Scan Selector Bar */}
          {currentCase && currentCase.scans?.length > 0 && (
             <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {currentCase.scans.map(scan => (
                    <button
                        key={scan.id}
                        onClick={() => setSelectedScanId(scan.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedScanId === scan.id || !selectedScanId && scan === currentCase.scans[0]
                            ? 'bg-[var(--color-accent-primary)] text-white shadow-lg'
                            : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        <span>{scan.modality} - {scan.bodyPart}</span>
                        <span className="opacity-60 text-xs">({scan.date})</span>
                    </button>
                ))}
             </div>
          )}

          <div className="h-[calc(100%-3.5rem)] grid grid-cols-3 gap-4">
            <div className="col-span-2 h-full rounded-2xl overflow-hidden border border-[var(--color-border)] bg-black relative">
              <ImageViewer 
                totalSlices={currentScan?.seriesCount ? currentScan.seriesCount * 30 : 120}
                currentSlice={currentSlice}
                onSliceChange={setCurrentSlice}
                metadata={data.metadata}
              />
              {/* Scan Technique Overlay */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1.5 rounded text-xs text-white border border-white/10">
                <p className="font-mono text-blue-400">PROTOCOL: {data.metadata.modality} {data.metadata.windowPreset}</p>
                <p className="opacity-70">kV: 120 • mAs: 240 • Slice: 1.0mm</p>
                {currentScan && <p className="opacity-70 mt-1">Scan ID: {currentScan.id} • {currentScan.seriesCount} Series</p>}
              </div>
            </div>

            <div className="h-full flex flex-col">
              <div className="flex gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-lg mb-4">
                <TabButton active={activeTab === 'findings'} icon={Brain} label="AI Findings" onClick={() => setActiveTab('findings')} />
                <TabButton active={activeTab === 'report'} icon={FileText} label="Report" onClick={() => setActiveTab('report')} />
                <TabButton active={activeTab === 'chat'} icon={MessageSquare} label="Assistant" onClick={() => setActiveTab('chat')} />
              </div>

              <div className="flex-1 overflow-auto">
                {activeTab === 'findings' && <FindingsPanel findings={data.findings} scan={currentScan} />}
                {activeTab === 'report' && <ReportPanel data={data.report} />}
                {activeTab === 'chat' && <ChatPanel />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, icon: Icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-[var(--color-accent-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function FindingsPanel({ findings, scan }: { findings: any[]; scan?: Scan }) {
  if (findings.length === 0) return <div className="p-4 text-center text-gray-500">No specific findings detected.</div>;
  
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Microscope className="w-5 h-5 text-purple-400" />
            Detected Pathologies
          </h3>
          <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">Analysis Complete</span>
        </div>
        <div className="space-y-3">
          {findings.map((finding) => (
            <motion.div
              key={finding.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                finding.urgency === 'high' ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--color-border)]'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {finding.urgency === 'high' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-green-400" />}
                  <span className="font-medium">{finding.label}</span>
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">{Math.round(finding.confidence * 100)}%</span>
              </div>
              <div className="text-sm text-[var(--color-text-secondary)] space-y-1">
                <p>Location: {finding.location}</p>
                <p>Size: {finding.size}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="card">
         <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Scan Metrics
         </h3>
         <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
               <p className="text-gray-500">Scan Date</p>
               <p className="font-medium">{scan?.date || 'N/A'}</p>
            </div>
            <div>
               <p className="text-gray-500">Series Count</p>
               <p className="font-medium">{scan?.seriesCount ? `${scan.seriesCount} Series` : 'Standard'}</p>
            </div>
            <div>
               <p className="text-gray-500">Noise Level</p>
               <p className="font-medium">Low (12 HU)</p>
            </div>
            <div>
               <p className="text-gray-500">Contrast Phase</p>
               <p className="font-medium">Venous</p>
            </div>
         </div>
      </div>
    </div>
  );
}

function ReportPanel({ data }: { data: any }) {
  return (
    <div className="card h-full flex flex-col">
      <h3 className="font-semibold mb-4">Radiology Report</h3>
      <div className="space-y-4 flex-1 overflow-auto">
        <div>
          <label className="block text-xs uppercase text-[var(--color-text-muted)] font-bold mb-1">Indication</label>
          <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-sm">{data.indication}</div>
        </div>
        <div>
          <label className="block text-xs uppercase text-[var(--color-text-muted)] font-bold mb-1">Findings</label>
          <textarea className="input min-h-[150px] font-mono text-sm leading-relaxed" defaultValue={data.findings} />
        </div>
        <div>
          <label className="block text-xs uppercase text-[var(--color-text-muted)] font-bold mb-1">Impression</label>
          <div className={`p-3 rounded-lg border-l-4 ${data.impression.includes('Normal') ? 'bg-green-500/10 border-green-500' : 'bg-yellow-500/10 border-yellow-500'}`}>
             <p className="font-semibold text-sm whitespace-pre-line">{data.impression}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-4 border-t border-[var(--color-border)]">
        <button className="btn btn-secondary flex-1">Save Draft</button>
        <button className="btn btn-primary flex-1">Sign & Export</button>
      </div>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I have analyzed the current study. Based on the findings, do you have any specific query regarding the pathology?' }
  ]);
  const [input, setInput] = useState('');

  return (
    <div className="card h-full flex flex-col">
      <h3 className="font-semibold mb-4">AI Assistant</h3>
      <div className="flex-1 overflow-auto space-y-3 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-500/20 ml-8' : 'bg-[var(--color-bg-tertiary)] mr-8'}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
           className="input flex-1" 
           placeholder="Ask AI..." 
           value={input} 
           onChange={e => setInput(e.target.value)}
        />
        <button className="btn btn-primary">Send</button>
      </div>
    </div>
  );
}
