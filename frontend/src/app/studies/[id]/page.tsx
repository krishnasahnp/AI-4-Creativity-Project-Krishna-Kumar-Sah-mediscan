'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FullImageViewer from '@/components/viewer/FullImageViewer';
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
  Mic,
  Paperclip,
  Send,
  Image as ImageIcon,
  Loader2,
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

  // Default SVG for CT (Matches Viewer Style)
  const CT_PLACEHOLDER = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+CiAgPGNpcmNsZSBjeD0iMjU2IiBjeT0iMjU2IiByPSIyMDAiIGZpbGw9IiMzNzQxNTEiLz4KICA8ZWxsaXBzZSBjeD0iMjU2IiBjeT0iMTkyIiByeD0iNjQiIHJ5PSI0MCIgZmlxsPSIjNjQ3NDhiIiBvcGFjaXR5PSIwLjUiLz4KICA8ZWxsaXBzZSBjeD0iMTkyIiBjeT0iMjU2IiByeD0iNDAiIHJ5PSI2NCIgZmlxsPSIjNjQ3NDhiIiBvcGFjaXR5PSIwLjMiIHRyYW5zZm9ybT0icm90YXRlKDE1IDE5MiAyNTYpIi8+CiAgPGVsbGlwc2UgY3g9IjMyMCIgY3k9IjI1NiIgcng9IjQwIiByeT0iNjQiIGZpbGw9IiM2NDc0OGIiIG9wYWNpdHk9IjAuMyIgdHJhbnNmb3JtPSJyb3RhdGUoLTE1IDMyMCAyNTYpIi8+CiAgPGNpcmNsZSBjeD0iMzQ1IiBjeT0iMjQwIiByPSI4IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC44Ii8+Cjwvc3ZnPg==`;


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
    <div className="h-screen bg-[var(--color-bg-primary)] flex overflow-hidden">
      <ConsentModal
        isOpen={showConsent}
        onAccept={() => setShowConsent(false)}
        onDecline={() => window.history.back()}
      />
      <KeyboardShortcutsHelp shortcuts={shortcuts} />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 overflow-hidden min-h-0 flex flex-col">
          {/* Scan Selector Bar */}
          {currentCase && currentCase.scans?.length > 0 && (
             <div className="mb-4 flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
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

          <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden min-h-0">
            <div className="col-span-2 h-full rounded-2xl overflow-hidden border border-[var(--color-border)] bg-black relative">
              <FullImageViewer 
                totalSlices={currentScan?.seriesCount ? currentScan.seriesCount * 30 : 120}
                currentSlice={currentSlice}
                onSliceChange={setCurrentSlice}
                modality={report.overview.modality}
                bodyPart={report.overview.region}
                imageUrl={currentScan?.url}
              />
              {/* Scan Technique Overlay - Detailed Medical Specs */}
              <div className="absolute top-20 left-4 bg-black/70 backdrop-blur-md px-4 py-3 rounded-lg text-xs text-white border border-white/10 shadow-xl max-w-xs transition-all hover:bg-black/80">
                <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="font-mono font-bold text-blue-400 tracking-wide uppercase">
                        {report.overview.modality} PROTOCOL: {report.overview.region} HELICAL
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 opacity-90 font-mono text-[10px]">
                    <div className="text-slate-400">Scanner:</div>
                    <div className="text-right">SIEMENS SOMATOM Force</div>
                    
                    <div className="text-slate-400">Acq Time:</div>
                    <div className="text-right">{new Date().toISOString().split('T')[0]} 09:42:15</div>
                    
                    <div className="text-slate-400">Technique:</div>
                    <div className="text-right">120kV / 240mAs</div>
                    
                    <div className="text-slate-400">Geometry:</div>
                    <div className="text-right">1.0mm / 0.5mm Int</div>
                    
                    <div className="text-slate-400">Dose (DLP):</div>
                    <div className="text-right text-orange-300">420 mGy*cm</div>
                    
                    <div className="text-slate-400">Position:</div>
                    <div className="text-right">HFS (Supine)</div>
                    
                    <div className="text-slate-400">Matrix:</div>
                    <div className="text-right">512 x 512 / 12 bit</div>
                </div>

                <div className="mt-2 pt-1 border-t border-white/10 flex justify-between uppercase tracking-wider text-[9px] text-slate-500">
                    <span>ACC: {currentScan?.id || 'SC-001'}</span>
                    <span>SERIES: {currentScan ? currentScan.seriesCount : 4}01</span>
                </div>
              </div>
            </div>

            <div className="h-full flex flex-col min-h-0 overflow-hidden">
              <div className="flex gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-lg mb-4 flex-shrink-0">
                <TabButton active={activeTab === 'analysis'} icon={Brain} label="AI Analysis" onClick={() => setActiveTab('analysis')} />
                <TabButton active={activeTab === 'chat'} icon={MessageSquare} label="Assistant" onClick={() => setActiveTab('chat')} />
              </div>

              <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-[#0f172a] min-h-0">
                {activeTab === 'analysis' && (
                    <AnalysisReport 
                        report={report} 
                        imageUrl={currentScan?.url || CT_PLACEHOLDER}
                    />
                )}
                {/* Note: In a real app, imageUrl would be dynamic based on currentScan.url */}
                {activeTab === 'chat' && <ChatPanel context={report} />}
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


function ChatPanel({ context }: { context: any }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello. I have analyzed the current study. I can help explain the findings or answer general questions. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Call API Route
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [...messages, { role: 'user', content: userMsg }],
                context: context
            })
        });
        
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to the analysis server. Please try again." }]);
    } finally {
        setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    if (!isListening) {
        setIsListening(true);
        setTimeout(() => {
            setIsListening(false);
            setInput(prev => prev + " What does the opacity in the upper lobe mean?");
        }, 2000);
    } else {
        setIsListening(false);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col relative">
      <div className="flex-1 overflow-auto space-y-4 mb-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-100 rounded-bl-none shadow-sm border border-slate-600'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
            <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 flex items-end gap-2">
        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5" />
        </button>
        <div className="flex-1">
            <textarea 
                className="w-full bg-transparent border-none text-white focus:ring-0 p-2 text-sm max-h-32 resize-none placeholder-slate-500"
                placeholder={isListening ? "Listening..." : "Ask anything about this scan..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                rows={1}
            />
        </div>
        <button 
            onClick={toggleVoice}
            className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
        >
            <Mic className="w-5 h-5" />
        </button>
        <button 
            onClick={handleSend}
            disabled={!input.trim() && !isListening}
            className={`p-2 rounded-lg transition-all ${
                input.trim() ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-700 text-slate-500'
            }`}
        >
            <Send className="w-4 h-4" />
        </button>
      </div>
      
      {/* Disclaimer */}
      <p className="text-[10px] text-center text-slate-600 mt-2">
        AI Assistant may make mistakes. Always check important info.
      </p>
    </div>
  );
}
