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

// --- Component ---
import { generateAIAnalysis } from '@/services/mockAiService';
import AnalysisReport from '@/components/analysis/AnalysisReport';

export default function StudyViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  
  const { cases } = useCases();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [showConsent, setShowConsent] = useState(true);
  const [currentSlice, setCurrentSlice] = useState(60);
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  
  // Data State
  const [report, setReport] = useState(generateAIAnalysis('CT', 'Chest'));

  const currentCase = cases.find(c => c.id === id);
  const currentScan = currentCase?.scans?.find(s => s.id === selectedScanId) || currentCase?.scans?.[0];

  useEffect(() => {
    if (currentCase) {
        // Default to first scan if none selected
        if (!selectedScanId && currentCase.scans?.length > 0) {
            setSelectedScanId(currentCase.scans[0].id);
        }
        
        // Generate AI Analysis Report
        if (currentScan) {
            setReport(generateAIAnalysis(currentScan.modality, currentScan.bodyPart));
        }
    } else {
        // Fallback for direct URL params
        const mod = searchParams.get('modality');
        const part = searchParams.get('bodyPart');
        if (mod || part) {
          setReport(generateAIAnalysis(mod || 'CT', part || 'Chest'));
        }
    }
  }, [id, cases, selectedScanId, searchParams, currentCase, currentScan]);

  // Keyboard shortcuts (unchanged)
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
                metadata={{
                    modality: report.overview.modality,
                    bodyPart: report.overview.region,
                    windowPreset: 'Default'
                }}
              />
              {/* Scan Technique Overlay */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1.5 rounded text-xs text-white border border-white/10">
                <p className="font-mono text-blue-400">PROTOCOL: {report.overview.modality} Default</p>
                <p className="opacity-70">kV: 120 • mAs: 240 • Slice: 1.0mm</p>
                {currentScan && <p className="opacity-70 mt-1">Scan ID: {currentScan.id} • {currentScan.seriesCount} Series</p>}
              </div>
            </div>

            <div className="h-full flex flex-col">
              <div className="flex gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-lg mb-4">
                <TabButton active={activeTab === 'analysis'} icon={Brain} label="AI Analysis" onClick={() => setActiveTab('analysis')} />
                <TabButton active={activeTab === 'chat'} icon={MessageSquare} label="Assistant" onClick={() => setActiveTab('chat')} />
              </div>

              <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-[#0f172a]">
                {activeTab === 'analysis' && <AnalysisReport report={report} />}
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

function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'I have analyzed the current study. Based on the findings, do you have any specific query regarding the pathology?' }
  ]);
  const [input, setInput] = useState('');

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex-1 overflow-auto space-y-3 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 ml-8 text-white' : 'bg-slate-700 mr-8 text-slate-200'}`}>
            {msg.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
           className="flex-1 bg-slate-800 border-none rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-blue-500" 
           placeholder="Ask AI..." 
           value={input} 
           onChange={e => setInput(e.target.value)}
        />
        <button className="bg-blue-600 px-4 py-2 rounded-lg text-white font-medium hover:bg-blue-700">Send</button>
      </div>
    </div>
  );
}
