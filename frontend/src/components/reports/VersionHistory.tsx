'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  ChevronDown, 
  ChevronRight,
  Eye,
  RotateCcw,
  Download,
  User,
  Cpu,
  Clock
} from 'lucide-react';

interface Version {
  id: string;
  version: string;
  createdAt: string;
  author: {
    type: 'human' | 'ai';
    name: string;
  };
  changes: string[];
  status: 'draft' | 'final' | 'archived';
}

interface VersionHistoryProps {
  reportId: string;
  versions: Version[];
  currentVersion: string;
  onViewVersion: (versionId: string) => void;
  onRestoreVersion: (versionId: string) => void;
  onDownloadVersion: (versionId: string) => void;
}

export default function VersionHistory({
  reportId,
  versions,
  currentVersion,
  onViewVersion,
  onRestoreVersion,
  onDownloadVersion,
}: VersionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final': return 'bg-green-500/20 text-green-400';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400';
      case 'archived': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
        aria-expanded={isExpanded}
        aria-label="Toggle version history"
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-blue-400" aria-hidden="true" />
          <span className="font-medium">Version History</span>
          <span className="text-sm text-[var(--color-text-muted)]">
            ({versions.length} versions)
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </motion.div>
      </button>

      {/* Version list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--color-border)]"
          >
            <div className="max-h-80 overflow-y-auto">
              {versions.map((version, index) => {
                const isCurrent = version.id === currentVersion;
                const isSelected = version.id === selectedVersion;

                return (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b border-[var(--color-border)] last:border-b-0 ${
                      isCurrent ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <button
                      onClick={() => setSelectedVersion(isSelected ? null : version.id)}
                      className="w-full p-4 text-left hover:bg-[var(--color-bg-tertiary)] transition-colors"
                      aria-expanded={isSelected}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{version.version}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(version.status)}`}>
                              {version.status}
                            </span>
                            {isCurrent && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                Current
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                            <div className="flex items-center gap-1">
                              {version.author.type === 'ai' ? (
                                <Cpu className="w-3 h-3" aria-hidden="true" />
                              ) : (
                                <User className="w-3 h-3" aria-hidden="true" />
                              )}
                              <span>{version.author.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              <span>{formatDate(version.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <motion.div
                          animate={{ rotate: isSelected ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                        </motion.div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4"
                        >
                          {/* Changes */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Changes:</h4>
                            <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                              {version.changes.map((change, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-blue-400">•</span>
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => onViewVersion(version.id)}
                              className="btn btn-ghost text-sm flex items-center gap-1"
                              aria-label={`View version ${version.version}`}
                            >
                              <Eye className="w-4 h-4" aria-hidden="true" />
                              View
                            </button>
                            {!isCurrent && (
                              <button
                                onClick={() => onRestoreVersion(version.id)}
                                className="btn btn-ghost text-sm flex items-center gap-1"
                                aria-label={`Restore version ${version.version}`}
                              >
                                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                                Restore
                              </button>
                            )}
                            <button
                              onClick={() => onDownloadVersion(version.id)}
                              className="btn btn-ghost text-sm flex items-center gap-1"
                              aria-label={`Download version ${version.version}`}
                            >
                              <Download className="w-4 h-4" aria-hidden="true" />
                              Download
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
