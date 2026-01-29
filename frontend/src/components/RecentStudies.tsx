'use client';

import Link from 'next/link';
import { FileImage, Eye, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { useCases } from '@/context/CasesContext';

const statusColors = {
  complete: 'text-green-400',
  processing: 'text-blue-400',
  pending: 'text-yellow-400',
  in_progress: 'text-blue-400',
  error: 'text-red-400',
};

const urgencyColors = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  normal: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export default function RecentStudies() {
  const { cases } = useCases();
  const recentCases = cases.slice(0, 5); // Show latest 5

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-[var(--color-text-muted)]">
            <th className="pb-3 font-medium">Study</th>
            <th className="pb-3 font-medium">Patient</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">AI Findings</th>
            <th className="pb-3 font-medium">Time</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {recentCases.map((study) => {
             const isUrgent = study.tags.includes('urgent');
             const urgencyClass = isUrgent ? urgencyColors.high : urgencyColors.normal;
             const modality = study.modalities[0] || 'CT';

             return (
            <tr
              key={study.id}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
            >
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    modality === 'CT' ? 'bg-blue-500/10' : 'bg-cyan-500/10'
                  )}>
                    <FileImage className={clsx(
                      'w-5 h-5',
                      modality === 'CT' ? 'text-blue-400' : 'text-cyan-400'
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">{study.id}</p>
                    <p className="text-[var(--color-text-muted)]">Medical Scan Analysis</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-[var(--color-text-secondary)]">
                <div>
                   <p className="text-white">{study.patientName}</p>
                   <p className="text-xs">{study.patientId}</p>
                </div>
              </td>
              <td className="py-4">
                <span className={clsx(
                  'px-2 py-1 rounded text-xs font-medium',
                  modality === 'CT' ? 'bg-blue-500/10 text-blue-400' : 'bg-cyan-500/10 text-cyan-400'
                )}>
                  {modality}
                </span>
              </td>
              <td className="py-4">
                <div className={clsx('flex items-center gap-2', statusColors[study.status as keyof typeof statusColors])}>
                  {study.status === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : study.status === 'in_progress' ? (
                    <Clock className="w-4 h-4 animate-pulse" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="capitalize">{study.status.replace('_', ' ')}</span>
                </div>
              </td>
              <td className="py-4">
                <span className={clsx(
                  'px-2 py-1 rounded border text-xs',
                  urgencyClass
                )}>
                  {study.aiFindings > 0 ? `${study.aiFindings} Findings` : 'Normal'}
                </span>
              </td>
              <td className="py-4 text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {study.createdAt}
                </div>
              </td>
              <td className="py-4">
                <Link href={`/studies/${study.id}`}>
                  <button className="btn btn-ghost p-2 hover:bg-[var(--color-primary-glow)] hover:text-[var(--color-primary-light)]">
                    <Eye className="w-4 h-4" />
                  </button>
                </Link>
              </td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}
