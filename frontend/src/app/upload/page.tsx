'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileImage,
  X,
  Check,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import clsx from 'clsx';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

export default function UploadPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [modality, setModality] = useState<'ct' | 'ultrasound'>('ct');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    
    // Simulate upload
    newFiles.forEach((file) => {
      simulateUpload(file.id);
    });
  }, []);

  const simulateUpload = (fileId: string) => {
    const updateProgress = (progress: number, status: UploadedFile['status']) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress, status } : f
        )
      );
    };

    updateProgress(0, 'uploading');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        clearInterval(interval);
        updateProgress(100, 'processing');
        setTimeout(() => updateProgress(100, 'complete'), 2000);
      } else {
        updateProgress(progress, 'uploading');
      }
    }, 300);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/dicom': ['.dcm', '.dicom'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'video/*': ['.mp4', '.avi'],
    },
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-2xl font-bold mb-2">Upload Study</h1>
              <p className="text-[var(--color-text-secondary)]">
                Upload DICOM files or medical images for AI analysis
              </p>
            </motion.div>

            {/* Modality Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card mb-6"
            >
              <h3 className="font-semibold mb-4">Select Modality</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setModality('ct')}
                  className={clsx(
                    'flex-1 p-4 rounded-lg border transition-all',
                    modality === 'ct'
                      ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                  )}
                >
                  <FileImage className={clsx(
                    'w-8 h-8 mb-2',
                    modality === 'ct' ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)]'
                  )} />
                  <p className="font-medium">CT Scan</p>
                  <p className="text-sm text-[var(--color-text-muted)]">DICOM series</p>
                </button>
                <button
                  onClick={() => setModality('ultrasound')}
                  className={clsx(
                    'flex-1 p-4 rounded-lg border transition-all',
                    modality === 'ultrasound'
                      ? 'border-[var(--color-accent-secondary)] bg-[var(--color-accent-secondary)]/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                  )}
                >
                  <FileImage className={clsx(
                    'w-8 h-8 mb-2',
                    modality === 'ultrasound' ? 'text-[var(--color-accent-secondary)]' : 'text-[var(--color-text-secondary)]'
                  )} />
                  <p className="font-medium">Ultrasound</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Images or video</p>
                </button>
              </div>
            </motion.div>

            {/* Drop Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card mb-6"
            >
              <div
                {...getRootProps()}
                className={clsx(
                  'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                )}
              >
                <input {...getInputProps()} />
                <Upload className={clsx(
                  'w-12 h-12 mx-auto mb-4',
                  isDragActive ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)]'
                )} />
                {isDragActive ? (
                  <p className="text-[var(--color-accent-primary)] font-medium">
                    Drop files here...
                  </p>
                ) : (
                  <>
                    <p className="text-[var(--color-text-secondary)] mb-2">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Supports DICOM (.dcm), images (.png, .jpg), and video (.mp4)
                    </p>
                  </>
                )}
              </div>
            </motion.div>

            {/* File List */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="card"
                >
                  <h3 className="font-semibold mb-4">Uploaded Files</h3>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        onRemove={() => removeFile(file.id)}
                      />
                    ))}
                  </div>
                  
                  {files.every(f => f.status === 'complete') && (
                    <div className="mt-6 flex justify-end">
                      <button className="btn btn-primary">
                        Start AI Analysis
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function FileItem({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  const statusIcons = {
    pending: <Loader2 className="w-4 h-4 text-gray-400" />,
    uploading: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    processing: <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />,
    complete: <Check className="w-4 h-4 text-green-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
  };

  const statusText = {
    pending: 'Pending',
    uploading: 'Uploading...',
    processing: 'Processing...',
    complete: 'Complete',
    error: 'Error',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-4 p-3 bg-[var(--color-bg-tertiary)] rounded-lg"
    >
      <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center">
        <FileImage className="w-5 h-5 text-[var(--color-text-muted)]" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.name}</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {statusIcons[file.status]}
          <span className="text-sm text-[var(--color-text-secondary)]">
            {statusText[file.status]}
          </span>
        </div>
        
        {file.status === 'uploading' && (
          <div className="w-24 h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent-primary)] transition-all"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}

        <button
          onClick={onRemove}
          className="p-1 hover:bg-[var(--color-bg-secondary)] rounded"
        >
          <X className="w-4 h-4 text-[var(--color-text-muted)]" />
        </button>
      </div>
    </motion.div>
  );
}
