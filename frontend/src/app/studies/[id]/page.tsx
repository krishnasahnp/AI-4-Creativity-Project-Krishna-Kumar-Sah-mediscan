'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ImageViewer from '@/components/viewer/ImageViewer';
import AIReviewPanel from '@/components/viewer/AIReviewPanel';
import ConsentModal from '@/components/ui/ConsentModal';
import ConfidenceBadge from '@/components/ui/ConfidenceBadge';
import { useKeyboardShortcuts, getViewerShortcuts, KeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';
import {
  Brain,
  FileText,
  MessageSquare,
  ChevronRight,
  Check,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

export default function StudyViewerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'findings' | 'report' | 'chat'>('findings');
  const [showConsent, setShowConsent] = useState(true);
  const [currentSlice, setCurrentSlice] = useState(60);
  const [showMask, setShowMask] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Keyboard shortcuts
  const shortcuts = getViewerShortcuts({
    nextSlice: () => setCurrentSlice(s => Math.min(s + 1, 120)),
    prevSlice: () => setCurrentSlice(s => Math.max(s - 1, 1)),
    zoomIn: () => console.log('Zoom in'),
    zoomOut: () => console.log('Zoom out'),
    resetView: () => setCurrentSlice(60),
    toggleMask: () => setShowMask(m => !m),
    toggleHeatmap: () => setShowHeatmap(h => !h),
    exportImage: () => console.log('Export image'),
    goToFirst: () => setCurrentSlice(1),
    goToLast: () => setCurrentSlice(120),
    play: () => console.log('Play/Pause'),
    increaseWindow: () => console.log('Increase window'),
    decreaseWindow: () => console.log('Decrease window'),
  });
  useKeyboardShortcuts({ shortcuts, enabled: !showConsent });

  const findings = [
    {
      id: 1,
      label: 'Pulmonary Nodule',
      confidence: 0.92,
      location: 'Right Lower Lobe',
      size: '12mm',
      urgency: 'high',
    },
    {
      id: 2,
      label: 'Ground Glass Opacity',
      confidence: 0.78,
      location: 'Left Upper Lobe',
      size: '8mm',
      urgency: 'medium',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      {/* Consent Modal */}
      <ConsentModal
        isOpen={showConsent}
        onAccept={() => setShowConsent(false)}
        onDecline={() => window.history.back()}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp shortcuts={shortcuts} />

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-4 overflow-hidden">
          <div className="h-full grid grid-cols-3 gap-4">
            {/* Viewer - Takes 2 columns */}
            <div className="col-span-2 h-full">
              <ImageViewer 
                totalSlices={120}
                currentSlice={currentSlice}
                onSliceChange={setCurrentSlice}
                metadata={{
                  modality: 'CT',
                  bodyPart: 'Chest',
                  windowPreset: 'Lung'
                }}
              />
            </div>

            {/* Right Panel */}
            <div className="h-full flex flex-col">
              {/* Tab Navigation */}
              <div className="flex gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-lg mb-4">
                <TabButton
                  active={activeTab === 'findings'}
                  icon={Brain}
                  label="AI Findings"
                  onClick={() => setActiveTab('findings')}
                />
                <TabButton
                  active={activeTab === 'report'}
                  icon={FileText}
                  label="Report"
                  onClick={() => setActiveTab('report')}
                />
                <TabButton
                  active={activeTab === 'chat'}
                  icon={MessageSquare}
                  label="Assistant"
                  onClick={() => setActiveTab('chat')}
                />
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto">
                {activeTab === 'findings' && (
                  <FindingsPanel findings={findings} />
                )}
                {activeTab === 'report' && (
                  <ReportPanel />
                )}
                {activeTab === 'chat' && (
                  <ChatPanel />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

function TabButton({ active, icon: Icon, label, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--color-accent-primary)] text-white'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

interface Finding {
  id: number;
  label: string;
  confidence: number;
  location: string;
  size: string;
  urgency: string;
}

function FindingsPanel({ findings }: { findings: Finding[] }) {
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">AI Analysis</h3>
          <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">
            Completed
          </span>
        </div>
        
        <div className="space-y-3">
          {findings.map((finding) => (
            <motion.div
              key={finding.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-[var(--color-border-hover)] ${
                finding.urgency === 'high'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {finding.urgency === 'high' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Check className="w-4 h-4 text-green-400" />
                  )}
                  <span className="font-medium">{finding.label}</span>
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">
                  {Math.round(finding.confidence * 100)}%
                </span>
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
        <h3 className="font-semibold mb-3">Confidence Calibration</h3>
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm">Model calibrated within ±5%</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              ECE: 0.023
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportPanel() {
  return (
    <div className="card h-full">
      <h3 className="font-semibold mb-4">Draft Report</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-1">
            Indication
          </label>
          <textarea
            className="input min-h-[60px]"
            defaultValue="Evaluation of pulmonary nodule detected on prior imaging."
          />
        </div>
        
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-1">
            Findings
          </label>
          <textarea
            className="input min-h-[120px]"
            defaultValue="AI analysis detected a 12mm solid nodule in the right lower lobe. Additional 8mm ground glass opacity noted in the left upper lobe."
          />
        </div>
        
        <div>
          <label className="block text-sm text-[var(--color-text-muted)] mb-1">
            Impression
          </label>
          <textarea
            className="input min-h-[80px]"
            defaultValue="1. Right lower lobe nodule - recommend follow-up CT in 3 months (Lung-RADS 4A).&#10;2. Left upper lobe ground glass opacity - likely benign."
          />
        </div>

        <div className="flex gap-2 pt-4 border-t border-[var(--color-border)]">
          <button className="btn btn-secondary flex-1">Save Draft</button>
          <button className="btn btn-primary flex-1">Sign Report</button>
        </div>
      </div>
    </div>
  );
}

function ChatPanel() {
  const [message, setMessage] = useState('');

  const messages = [
    {
      role: 'assistant',
      content: 'Hello! I can help you analyze this study. What would you like to know?'
    },
    {
      role: 'user',
      content: 'Show me similar cases with this finding pattern'
    },
    {
      role: 'assistant',
      content: 'I found 3 similar cases with comparable nodule characteristics. The most similar case (91% match) shows a patient with a 14mm RLL nodule that was confirmed benign on follow-up.'
    }
  ];

  return (
    <div className="card h-full flex flex-col">
      <h3 className="font-semibold mb-4">AI Assistant</h3>
      
      <div className="flex-1 overflow-auto space-y-3 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-[var(--color-accent-primary)]/10 ml-8'
                : 'bg-[var(--color-bg-tertiary)] mr-8'
            }`}
          >
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Ask about this study..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="btn btn-primary">Send</button>
      </div>
    </div>
  );
}
