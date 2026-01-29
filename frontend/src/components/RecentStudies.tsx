'use client';

import { FileImage, Eye, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const studies = [
  {
    id: 'STD-2847',
    patient: 'MRN-45821',
    modality: 'CT',
    description: 'CT Chest with Contrast',
    status: 'complete',
    aiFindings: 'Nodule detected',
    time: '10 min ago',
    urgency: 'high',
  },
  {
    id: 'STD-2846',
    patient: 'MRN-45820',
    modality: 'US',
    description: 'Abdominal Ultrasound',
    status: 'processing',
    aiFindings: 'Processing...',
    time: '25 min ago',
    urgency: 'normal',
  },
  {
    id: 'STD-2845',
    patient: 'MRN-45819',
    modality: 'CT',
    description: 'CT Head without Contrast',
    status: 'complete',
    aiFindings: 'Normal',
    time: '1 hour ago',
    urgency: 'normal',
  },
  {
    id: 'STD-2844',
    patient: 'MRN-45818',
    modality: 'US',
    description: 'Thyroid Ultrasound',
    status: 'complete',
    aiFindings: 'Mild abnormality',
    time: '2 hours ago',
    urgency: 'medium',
  },
];

const statusColors = {
  complete: 'text-green-400',
  processing: 'text-blue-400',
  pending: 'text-yellow-400',
  error: 'text-red-400',
};

const urgencyColors = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  normal: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export default function RecentStudies() {
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
          {studies.map((study) => (
            <tr
              key={study.id}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
            >
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    study.modality === 'CT' ? 'bg-blue-500/10' : 'bg-cyan-500/10'
                  )}>
                    <FileImage className={clsx(
                      'w-5 h-5',
                      study.modality === 'CT' ? 'text-blue-400' : 'text-cyan-400'
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">{study.id}</p>
                    <p className="text-[var(--color-text-muted)]">{study.description}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-[var(--color-text-secondary)]">{study.patient}</td>
              <td className="py-4">
                <span className={clsx(
                  'px-2 py-1 rounded text-xs font-medium',
                  study.modality === 'CT' ? 'bg-blue-500/10 text-blue-400' : 'bg-cyan-500/10 text-cyan-400'
                )}>
                  {study.modality}
                </span>
              </td>
              <td className="py-4">
                <div className={clsx('flex items-center gap-2', statusColors[study.status as keyof typeof statusColors])}>
                  {study.status === 'complete' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : study.status === 'processing' ? (
                    <Clock className="w-4 h-4 animate-pulse" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="capitalize">{study.status}</span>
                </div>
              </td>
              <td className="py-4">
                <span className={clsx(
                  'px-2 py-1 rounded border text-xs',
                  urgencyColors[study.urgency as keyof typeof urgencyColors]
                )}>
                  {study.aiFindings}
                </span>
              </td>
              <td className="py-4 text-[var(--color-text-muted)]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {study.time}
                </div>
              </td>
              <td className="py-4">
                <button className="btn btn-ghost p-2">
                  <Eye className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
