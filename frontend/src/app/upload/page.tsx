'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileImage,
  X,
  Check,
  AlertCircle,
  Loader2,
  Scan,
  Radio,
  CloudUpload,
  Sparkles,
  ArrowRight,
  FileVideo,
  File,
  Brain,
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

import { useCases } from '@/context/CasesContext';
import AuthGuard from '@/components/auth/AuthGuard';

export default function UploadPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [modality, setModality] = useState<'ct' | 'ultrasound' | 'mri' | 'xray'>('ct');
  const [bodyPart, setBodyPart] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadMode, setUploadMode] = useState<'new' | 'existing'>('new');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  
  const router = useRouter();
  const { addCase, addScan, cases } = useCases();
  
  const BODY_PARTS = {
    ct: ['Head', 'Chest', 'Abdomen', 'Spine (Cervical)', 'Spine (Lumbar)', 'Pelvis'],
    mri: ['Brain', 'Spine', 'Knee', 'Shoulder', 'Cardiac'],
    ultrasound: ['Abdomen', 'Thyroid', 'Carotid', 'Obstetric', 'Pelvic'],
    xray: ['Chest', 'Abdomen', 'Spine', 'Extremity (Upper)', 'Extremity (Lower)']
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate AI Processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create scan object
    const part = bodyPart || BODY_PARTS[modality][0];
    const today = new Date().toISOString().split('T')[0];
    const scanId = `SC-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newScan = {
        id: scanId,
        modality: modality.toUpperCase(),
        bodyPart: part,
        date: today,
        status: 'complete' as const,
        seriesCount: files.length || 1,
    };

    let targetCaseId = '';

    if (uploadMode === 'new') {
        // Create new case
        const caseId = `CASE-${String(cases.length + 1).padStart(3, '0')}`;
        const newCaseEntry = {
          id: caseId,
          patientId: patientId || `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
          patientName: patientName || (files[0]?.name ? `Patient (${files[0].name.split('.')[0]})` : 'Anonymous Patient'),
          status: 'complete' as const,
          studies: 1,
          scans: [newScan],
          modalities: [modality.toUpperCase()],
          createdAt: today,
          aiFindings: Math.floor(Math.random() * 3) + 1,
          tags: ['new-upload'],
        };
        addCase(newCaseEntry);
        targetCaseId = caseId;
    } else {
        // Add to existing case
        if (!selectedCaseId) return;
        addScan(selectedCaseId, newScan);
        targetCaseId = selectedCaseId;
    }

    // Redirect to the study viewer for the case
    router.push(`/studies/${targetCaseId}`);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // ... existing onDrop ...
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    
    newFiles.forEach((file) => {
      simulateUpload(file.id);
    });
  }, []);

    // ... existing simulateUpload ...
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

  const modalities = [
    { id: 'ct', name: 'CT Scan', desc: 'DICOM series', icon: Scan, color: '#0d9488' },
    { id: 'ultrasound', name: 'Ultrasound', desc: 'Images/Video', icon: Radio, color: '#3b82f6' },
    { id: 'mri', name: 'MRI', desc: 'DICOM series', icon: FileImage, color: '#8b5cf6' },
    { id: 'xray', name: 'X-Ray', desc: 'Digital images', icon: FileImage, color: '#f59e0b' },
  ];

  return (
    <AuthGuard>
    <div className="min-h-screen flex" style={{ background: '#0c1222' }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Analysis Loading Overlay ... (omitted, stays same) */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c1222]/90 backdrop-blur-md"
            >
              <div className="w-32 h-32 relative mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-t-[#0d9488] border-r-transparent border-b-[#0d9488] border-l-transparent animate-spin" />
                <div className="absolute inset-4 rounded-full border-4 border-t-[#14b8a6] border-r-transparent border-b-[#14b8a6] border-l-transparent animate-spin-reverse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-12 h-12 text-[#14b8a6] animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Running AI Analysis</h2>
              <p className="text-[#94a3b8]">Processing {files.length} images for anomalies...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                    boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)',
                  }}
                >
                  <CloudUpload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#f1f5f9]">Upload Study</h1>
                  <p className="text-[#94a3b8]">
                    Upload DICOM files or medical images for AI analysis
                  </p>
                </div>
              </div>

              {/* Case Selection Toggle */}
              <div className="bg-[rgba(26,39,68,0.5)] p-1 rounded-xl flex mb-6 border border-[rgba(148,163,184,0.1)] w-full sm:w-fit">
                <button
                    onClick={() => setUploadMode('new')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        uploadMode === 'new' 
                        ? 'bg-[#14b8a6] text-white shadow-lg shadow-teal-500/20' 
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                >
                    New Patient Case
                </button>
                <button
                    onClick={() => setUploadMode('existing')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        uploadMode === 'existing' 
                        ? 'bg-[#14b8a6] text-white shadow-lg shadow-teal-500/20' 
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                >
                    Add to Existing Case
                </button>
              </div>

              {uploadMode === 'existing' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8"
                  >
                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Select Patient Case</label>
                    <select 
                        value={selectedCaseId} 
                        onChange={(e) => setSelectedCaseId(e.target.value)}
                        className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors appearance-none"
                    >
                        <option value="">-- Select a Case --</option>
                        {cases.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.id} - {c.patientName} ({c.patientId})
                            </option>
                        ))}
                    </select>
                  </motion.div>
              )}

              {uploadMode === 'new' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                     <div>
                        <label className="block text-sm font-medium text-[#94a3b8] mb-2">Patient Name</label>
                        <input 
                           type="text" 
                           value={patientName}
                           onChange={(e) => setPatientName(e.target.value)}
                           className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                           placeholder="e.g. John Doe" 
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-[#94a3b8] mb-2">Patient ID (Optional)</label>
                        <input 
                           type="text" 
                           value={patientId}
                           onChange={(e) => setPatientId(e.target.value)}
                           className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                           placeholder="Leave blank to auto-generate" 
                        />
                     </div>
                  </motion.div>
              )}
            </motion.div>

            {/* Modality Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-4">
                Select Modality
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {modalities.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setModality(mod.id as typeof modality)}
                    className="p-4 rounded-2xl transition-all text-left group"
                    style={{
                      background: modality === mod.id 
                        ? `linear-gradient(135deg, ${mod.color}20, ${mod.color}10)`
                        : 'rgba(26, 39, 68, 0.5)',
                      border: modality === mod.id 
                        ? `2px solid ${mod.color}` 
                        : '2px solid rgba(148, 163, 184, 0.1)',
                      boxShadow: modality === mod.id 
                        ? `0 0 30px ${mod.color}30` 
                        : 'none',
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                      style={{
                        background: modality === mod.id 
                          ? `linear-gradient(135deg, ${mod.color}, ${mod.color}cc)`
                          : 'rgba(148, 163, 184, 0.1)',
                        boxShadow: modality === mod.id 
                          ? `0 4px 15px ${mod.color}50` 
                          : 'none',
                      }}
                    >
                      <mod.icon 
                        className="w-5 h-5" 
                        style={{ color: modality === mod.id ? 'white' : '#94a3b8' }} 
                      />
                    </div>
                    <p 
                      className="font-semibold text-sm"
                      style={{ color: modality === mod.id ? '#f1f5f9' : '#94a3b8' }}
                    >
                      {mod.name}
                    </p>
                    <p className="text-xs text-[#64748b]">{mod.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Body Part Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-8"
            >
              <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-4">
                Select Analysis Region (Body Part)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {BODY_PARTS[modality].map((part) => (
                  <button
                    key={part}
                    onClick={() => setBodyPart(part)}
                    className="p-3 rounded-xl text-sm font-medium transition-all text-center"
                    style={{
                      background: bodyPart === part 
                        ? 'rgba(13, 148, 136, 0.2)' 
                        : 'rgba(26, 39, 68, 0.5)',
                      color: bodyPart === part ? '#14b8a6' : '#94a3b8',
                      border: bodyPart === part 
                        ? '1px solid rgba(13, 148, 136, 0.4)' 
                        : '1px solid rgba(148, 163, 184, 0.1)',
                      boxShadow: bodyPart === part 
                        ? '0 0 15px rgba(13, 148, 136, 0.2)' 
                        : 'none',
                    }}
                  >
                    {part}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Drop Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div
                {...getRootProps()}
                className="relative rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all overflow-hidden group"
                style={{
                  background: isDragActive 
                    ? 'linear-gradient(135deg, rgba(13, 148, 136, 0.15), rgba(6, 182, 212, 0.1))'
                    : 'linear-gradient(180deg, rgba(26, 39, 68, 0.6) 0%, rgba(17, 26, 46, 0.8) 100%)',
                  border: isDragActive 
                    ? '2px dashed #0d9488' 
                    : '2px dashed rgba(148, 163, 184, 0.2)',
                  boxShadow: isDragActive 
                    ? '0 0 40px rgba(13, 148, 136, 0.2), inset 0 0 60px rgba(13, 148, 136, 0.05)'
                    : 'none',
                }}
              >
                {/* Animated background pattern */}
                <div 
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #0d9488 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                  }}
                />
                
                <input {...getInputProps()} />
                
                <motion.div
                  animate={{ 
                    y: isDragActive ? -10 : 0,
                    scale: isDragActive ? 1.1 : 1,
                  }}
                  className="relative"
                >
                  <div 
                    className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center transition-all"
                    style={{
                      background: isDragActive 
                        ? 'linear-gradient(135deg, #0d9488, #14b8a6)'
                        : 'rgba(148, 163, 184, 0.1)',
                      boxShadow: isDragActive 
                        ? '0 8px 30px rgba(13, 148, 136, 0.4)' 
                        : 'none',
                    }}
                  >
                    <Upload 
                      className="w-10 h-10 transition-all"
                      style={{ color: isDragActive ? 'white' : '#64748b' }}
                    />
                  </div>
                  
                  {isDragActive ? (
                    <p className="text-xl font-semibold" style={{ color: '#14b8a6' }}>
                      Drop files to upload
                    </p>
                  ) : (
                    <>
                      <p className="text-xl font-semibold text-[#f1f5f9] mb-2">
                        Drag & drop files here
                      </p>
                      <p className="text-[#94a3b8] mb-4">
                        or click to browse from your computer
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          { ext: 'DICOM', icon: File },
                          { ext: 'PNG/JPG', icon: FileImage },
                          { ext: 'MP4', icon: FileVideo },
                        ].map((type) => (
                          <span 
                            key={type.ext}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{
                              background: 'rgba(148, 163, 184, 0.1)',
                              color: '#94a3b8',
                              border: '1px solid rgba(148, 163, 184, 0.15)',
                            }}
                          >
                            <type.icon className="w-3.5 h-3.5" />
                            {type.ext}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* File List */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(26, 39, 68, 0.7) 0%, rgba(17, 26, 46, 0.9) 100%)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                  }}
                >
                  <div className="p-4 sm:p-6 border-b border-[rgba(148,163,184,0.1)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#14b8a6]" />
                        <h3 className="font-semibold text-[#f1f5f9]">
                          Uploaded Files ({files.length})
                        </h3>
                      </div>
                      <span className="text-sm text-[#64748b]">
                        {files.filter(f => f.status === 'complete').length} ready for analysis
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 space-y-3">
                    {files.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        onRemove={() => removeFile(file.id)}
                      />
                    ))}
                  </div>
                  
                  {files.every(f => f.status === 'complete') && (
                    <div className="p-4 sm:p-6 border-t border-[rgba(148,163,184,0.1)]">
                      <button 
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                          boxShadow: '0 4px 20px rgba(13, 148, 136, 0.4)',
                        }}
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Start AI Analysis'}
                        {!isAnalyzing && <ArrowRight className="w-5 h-5" />}
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
    </AuthGuard>
  );
}

function FileItem({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  const statusConfig = {
    pending: { icon: Loader2, color: '#64748b', text: 'Pending', spin: false },
    uploading: { icon: Loader2, color: '#3b82f6', text: 'Uploading...', spin: true },
    processing: { icon: Loader2, color: '#f59e0b', text: 'Processing...', spin: true },
    complete: { icon: Check, color: '#10b981', text: 'Ready', spin: false },
    error: { icon: AlertCircle, color: '#f43f5e', text: 'Error', spin: false },
  };

  const config = statusConfig[file.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-4 p-4 rounded-xl transition-all"
      style={{
        background: 'rgba(26, 39, 68, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
      }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(148, 163, 184, 0.1)' }}
      >
        <FileImage className="w-6 h-6 text-[#64748b]" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#f1f5f9] truncate">{file.name}</p>
        <p className="text-sm text-[#64748b]">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Progress bar for uploading */}
        {file.status === 'uploading' && (
          <div className="hidden sm:block w-32">
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(59, 130, 246, 0.2)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
                initial={{ width: 0 }}
                animate={{ width: `${file.progress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Status */}
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${config.color}20` }}
          >
            <Icon 
              className={`w-4 h-4 ${config.spin ? 'animate-spin' : ''}`}
              style={{ color: config.color }}
            />
          </div>
          <span 
            className="hidden sm:block text-sm font-medium"
            style={{ color: config.color }}
          >
            {config.text}
          </span>
        </div>

        <button
          onClick={onRemove}
          className="p-2 rounded-lg transition-all hover:bg-[rgba(244,63,94,0.1)]"
        >
          <X className="w-4 h-4 text-[#64748b] hover:text-[#f43f5e]" />
        </button>
      </div>
    </motion.div>
  );
}
