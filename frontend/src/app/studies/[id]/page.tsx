'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import FullImageViewer from '@/components/viewer/FullImageViewer';
import ConsentModal from '@/components/ui/ConsentModal';
import Toast, { ToastType } from '@/components/ui/Toast';
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
import { studyService } from '@/services/studyService';
import { reportService } from '@/services/reportService';

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
  const [studyId, setStudyId] = useState<string>('');
  const [studyStatus, setStudyStatus] = useState<string>('pending');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  
  // View Mode: 'source' = Uploaded Image, 'simulation' = Procedural Viz/Analysis
  const [viewMode, setViewMode] = useState<'source' | 'simulation'>('source');
  
  // Data State
  const [report, setReport] = useState(generateAIAnalysis('CT', 'Chest'));

  // Default SVG for CT (Matches Viewer Style)
  const CT_PLACEHOLDER = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUxZTFlIi8+CiAgPGNpcmNsZSBjeD0iMjU2IiBjeT0iMjU2IiByPSIyMDAiIGZpbGw9IiMzNzQxNTEiLz4KICA8ZWxsaXBzZSBjeD0iMjU2IiBjeT0iMTkyIiByeD0iNjQiIHJ5PSI0MCIgZmlxsPSIjNjQ3NDhiIiBvcGFjaXR5PSIwLjUiLz4KICA8ZWxsaXBzZSBjeD0iMTkyIiBjeT0iMjU2IiByeD0iNDAiIHJ5PSI2NCIgZmlxsPSIjNjQ3NDhiIiBvcGFjaXR5PSIwLjMiIHRyYW5zZm9ybT0icm90YXRlKDE1IDE5MiAyNTYpIi8+CiAgPGVsbGlwc2UgY3g9IjMyMCIgY3k9IjI1NiIgcng9IjQwIiByeT0iNjQiIGZpbGw9IiM2NDc0OGIiIG9wYWNpdHk9IjAuMyIgdHJhbnNmb3JtPSJyb3RhdGUoLTE1IDMyMCAyNTYpIi8+CiAgPGNpcmNsZSBjeD0iMzQ1IiBjeT0iMjQwIiByPSI4IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC44Ii8+Cjwvc3ZnPg==`;


  const [study, setStudy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve case from Context using study.case_id if available, otherwise try param id
  const currentCase = useMemo(() => {
    if (study?.case_id) {
        return cases.find(c => c.id === study.case_id);
    }
    return cases.find(c => c.id === id);
  }, [cases, study, id]);

  const currentScan = currentCase?.scans?.find(s => s.id === selectedScanId) || currentCase?.scans?.[0];

  // Helper function to convert file path to URL
  const getImageUrl = (filePath: string) => {
    if (!filePath) return undefined;
    
    // Simplest logic: Strip everything up to the first UUID/CaseID segment
    // We assume structure is .../uploads/CASE_ID/STUDY_ID/FILE
    // Or just CASE_ID/STUDY_ID/FILE
    
    let cleanPath = filePath;
    // Remove ./ and / prefixes
    while(cleanPath.startsWith('./') || cleanPath.startsWith('/')) {
        cleanPath = cleanPath.startsWith('./') ? cleanPath.substring(2) : cleanPath.substring(1);
    }
    
    // If it's a full URL, trust it
    if (cleanPath.startsWith('http')) return cleanPath;
    
    // Remove "uploads/" prefix if present (multiple times even)
    // We essentially want the part AFTER the uploads/ directory
    if (cleanPath.includes('uploads/')) {
        const parts = cleanPath.split('uploads/');
        cleanPath = parts[parts.length - 1]; // Get the last segment
    }
    
    // Using window.location to handle network access
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:8000`;
    
    // Normalize backend URL to NOT end with slash
    const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    
    // Backend Static Mount is at /uploads
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  // Get the first image URL from study
  const imageUrl = useMemo(() => {
    // 1. Try from study data (Most reliable)
    if (study && study.series && study.series.length > 0) {
        const firstSeries = study.series.find((s: any) => s.images && s.images.length > 0);
        if (firstSeries && firstSeries.images[0]?.file_path) {
            return getImageUrl(firstSeries.images[0].file_path);
        }
    }
    
    // 2. Try from currentScan prop (Fallback)
    if (currentScan?.url) {
        return currentScan.url;
    }
    
    return undefined;
  }, [study, currentScan]);

  // Force View Mode to 'source' when Image URL becomes available
  useEffect(() => {
      if (imageUrl && viewMode !== 'source') {
          console.log("Switching to Source view", imageUrl);
          setViewMode('source');
      }
  }, [imageUrl]);

  // Fetch study from API
  useEffect(() => {
    const fetchStudy = async () => {
      try {
        setLoading(true);
        setError(null);
        // Ensure ID is valid
        const targetId = id || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');
        if(!targetId) return;

        console.log("Fetching study:", targetId);
        const studyData = await studyService.getStudyById(targetId);
        console.log("Study Data loaded:", studyData);
        
        setStudy(studyData);
        setStudyId(studyData.id);
        if (studyData.status) setStudyStatus(studyData.status);

      } catch (err: any) {
        console.error('Failed to fetch study:', err);
        setError(err.message || 'Failed to load study data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudy();
  }, [id]);

  useEffect(() => {
    if (currentCase) {
        // Default to first scan if none selected
        if (!selectedScanId && currentCase.scans?.length > 0) {
             // ensure we map correctly
        }
    }
  }, [currentCase]);

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

  const handleGenerateReport = async () => {
    // 1. Try state, 2. Try params, 3. Try parsing URL directly
    let targetStudyId = studyId || id;
    if (!targetStudyId && typeof window !== 'undefined') {
        const parts = window.location.pathname.split('/');
        targetStudyId = parts[parts.length - 1]; // Assume last part is ID
    }

    if (!targetStudyId) {
        setToast({ message: 'Study ID not found. Please refresh.', type: 'error' });
        return;
    }
    
    try {
      setIsGeneratingReport(true);
      // 1. Generate the report entry
      await reportService.generateReport(targetStudyId);
      
      // 2. Update status
      await studyService.updateStudyStatus(targetStudyId, 'reports_generated');
      setStudyStatus('reports_generated');
      
      setToast({ message: 'Report generated successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      setToast({ message: `Failed to generate report: ${error.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
          {/* Scan Selector & View Toggle Bar - Always visible if study exists */}
          {(study || (currentCase && currentCase.scans?.length > 0)) && (
             <div className="mb-4 flex items-center justify-between gap-4">
              {/* Scan Selector */}
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
                  {currentCase?.scans?.map(scan => (
                      <button
                          key={scan.id}
                          onClick={() => setSelectedScanId(scan.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                              selectedScanId === scan.id || (!selectedScanId && scan === currentCase.scans[0])
                              ? 'bg-[var(--color-accent-primary)] text-white shadow-lg'
                              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                          }`}
                      >
                          <Activity className="w-4 h-4" />
                          <span>{scan.modality} - {scan.bodyPart}</span>
                          <span className="opacity-60 text-xs">({scan.date})</span>
                      </button>
                  ))}
                  {!currentCase && study && (
                       <div className="px-4 py-2 rounded-lg bg-[var(--color-accent-primary)] text-white text-sm font-medium">
                          {study.modality} - {study.body_part || 'Study'}
                       </div>
                  )}
              </div>
              
              {/* View Mode Toggle */}
              <div className="bg-[var(--color-bg-secondary)] p-1 rounded-lg border border-[var(--color-border)] flex flex-shrink-0">
                  <button
                      onClick={() => setViewMode('source')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          viewMode === 'source' 
                          ? 'bg-blue-600 text-white shadow' 
                          : 'text-[var(--color-text-secondary)] hover:text-white'
                      }`}
                  >
                      Source Image
                  </button>
                  <button
                      onClick={() => setViewMode('simulation')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          viewMode === 'simulation' 
                          ? 'bg-teal-600 text-white shadow' 
                          : 'text-[var(--color-text-secondary)] hover:text-white'
                      }`}
                  >
                      AI Simulation
                  </button>
              </div>
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
                imageUrl={viewMode === 'source' ? imageUrl : undefined}
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
            {/* Tab Buttons & Generate Report */}
            <div className="flex items-center gap-3 p-1 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] shadow-sm flex-shrink-0 mb-4">
              <div className="flex flex-1 gap-1">
                <TabButton active={activeTab === 'analysis'} icon={Brain} label="AI Analysis" onClick={() => setActiveTab('analysis')} />
                <TabButton active={activeTab === 'chat'} icon={MessageSquare} label="AI Assistant" onClick={() => setActiveTab('chat')} />
              </div>
              {studyStatus !== 'reports_generated' && (
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-semibold hover:from-teal-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </button>
              )}
            </div>

              <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-[#0f172a] min-h-0">
                {activeTab === 'analysis' && (
                    <AnalysisReport 
                        report={report} 
                        imageUrl={imageUrl || CT_PLACEHOLDER}
                    />
                )}
                {/* Note: In a real app, imageUrl would be dynamic based on currentScan.url */}
                {activeTab === 'chat' && <ChatPanel context={report} />}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
      
      {/* Debug Info - Always Visible for Troubleshooting */}
      <div className="fixed bottom-0 right-0 bg-black/90 text-green-400 p-2 text-xs max-w-lg max-h-60 overflow-auto z-50 border-t border-green-900 font-mono shadow-2xl">
          <details open>
              <summary className="cursor-pointer font-bold hover:text-green-300"> 🛠️ Debug: Image & Study Data</summary>
              <div className="mt-1 pl-2 space-y-1">
                  <div>Study ID (Param): {id}</div>
                  <div>Study ID (State): {studyId}</div>
                  <div>View Mode: {viewMode}</div>
                  <div>Image URL: <a href={imageUrl} target="_blank" className="underline text-blue-400">{imageUrl || 'None'}</a></div>
                  <div>Study Loaded: {study ? 'Yes' : 'No'}</div>
                  {error && <div className="text-red-500 font-bold bg-white/10 p-1 rounded">Error: {error}</div>}
                  <div>Series Count: {study?.series?.length || 0}</div>
                  <div>First Series Images: {study?.series?.[0]?.images?.length || 0}</div>
                  <div>Raw Path: {study?.series?.[0]?.images?.[0]?.file_path || 'N/A'}</div>
              </div>
          </details>
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
