'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface AIFinding {
  id: string;
  type: string;
  label: string;
  confidence: number;
  location?: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface AIReviewPanelProps {
  findings: AIFinding[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onComment: (id: string, comment: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export default function AIReviewPanel({
  findings,
  onAccept,
  onReject,
  onComment,
  onAcceptAll,
  onRejectAll,
}: AIReviewPanelProps) {
  const [reviewedFindings, setReviewedFindings] = useState<Record<string, 'accepted' | 'rejected'>>({});
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [showCommentFor, setShowCommentFor] = useState<string | null>(null);

  const handleAccept = (id: string) => {
    setReviewedFindings(prev => ({ ...prev, [id]: 'accepted' }));
    onAccept(id);
  };

  const handleReject = (id: string) => {
    setReviewedFindings(prev => ({ ...prev, [id]: 'rejected' }));
    onReject(id);
  };

  const handleAddComment = (id: string) => {
    if (commentInput[id]?.trim()) {
      onComment(id, commentInput[id]);
      setShowCommentFor(null);
      setCommentInput(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleAcceptAllUnreviewed = () => {
    const unreviewedIds = findings
      .filter(f => !reviewedFindings[f.id])
      .map(f => f.id);
    
    const newReviewed = { ...reviewedFindings };
    unreviewedIds.forEach(id => {
      newReviewed[id] = 'accepted';
    });
    setReviewedFindings(newReviewed);
    onAcceptAll();
  };

  const handleRejectAllUnreviewed = () => {
    const unreviewedIds = findings
      .filter(f => !reviewedFindings[f.id])
      .map(f => f.id);
    
    const newReviewed = { ...reviewedFindings };
    unreviewedIds.forEach(id => {
      newReviewed[id] = 'rejected';
    });
    setReviewedFindings(newReviewed);
    onRejectAll();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400 bg-green-500/20';
    if (confidence >= 0.7) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-green-500 bg-green-500/10';
    }
  };

  const reviewedCount = Object.keys(reviewedFindings).length;
  const acceptedCount = Object.values(reviewedFindings).filter(v => v === 'accepted').length;
  const rejectedCount = Object.values(reviewedFindings).filter(v => v === 'rejected').length;

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">AI Findings Review</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {reviewedCount}/{findings.length} reviewed • 
            <span className="text-green-400"> {acceptedCount} accepted</span> • 
            <span className="text-red-400"> {rejectedCount} rejected</span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAcceptAllUnreviewed}
            className="btn btn-ghost text-green-400 hover:bg-green-500/20 text-sm"
          >
            <Check className="w-4 h-4" />
            Accept All
          </button>
          <button
            onClick={handleRejectAllUnreviewed}
            className="btn btn-ghost text-red-400 hover:bg-red-500/20 text-sm"
          >
            <X className="w-4 h-4" />
            Reject All
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full mb-4 overflow-hidden">
        <div className="h-full flex">
          <div 
            className="bg-green-500 transition-all"
            style={{ width: `${(acceptedCount / findings.length) * 100}%` }}
          />
          <div 
            className="bg-red-500 transition-all"
            style={{ width: `${(rejectedCount / findings.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Findings list */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {findings.map((finding) => {
          const status = reviewedFindings[finding.id];
          const isExpanded = expandedFinding === finding.id;

          return (
            <motion.div
              key={finding.id}
              layout
              className={`border-l-4 rounded-lg p-4 transition-all ${
                status === 'accepted' ? 'border-green-500 bg-green-500/5' :
                status === 'rejected' ? 'border-red-500 bg-red-500/5 opacity-60' :
                getSeverityColor(finding.severity)
              }`}
            >
              {/* Main content */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{finding.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(finding.confidence)}`}>
                      {(finding.confidence * 100).toFixed(0)}% confidence
                    </span>
                    {finding.severity === 'high' && (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle className="w-3 h-3" />
                        High severity
                      </span>
                    )}
                  </div>
                  {finding.location && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Location: {finding.location}
                    </p>
                  )}
                </div>

                {/* Review buttons */}
                {!status && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(finding.id)}
                      className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                      title="Accept finding"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(finding.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Reject finding"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowCommentFor(showCommentFor === finding.id ? null : finding.id)}
                      className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      title="Add comment"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {status && (
                  <div className={`flex items-center gap-1 text-sm ${
                    status === 'accepted' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {status === 'accepted' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                )}
              </div>

              {/* Expand button */}
              <button
                onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] mt-2 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {isExpanded ? 'Hide details' : 'Show details'}
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-[var(--color-border)]"
                  >
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {finding.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Comment input */}
              <AnimatePresence>
                {showCommentFor === finding.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInput[finding.id] || ''}
                      onChange={(e) => setCommentInput(prev => ({ ...prev, [finding.id]: e.target.value }))}
                      className="input flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(finding.id)}
                    />
                    <button
                      onClick={() => handleAddComment(finding.id)}
                      className="btn btn-primary text-sm"
                    >
                      Add
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
