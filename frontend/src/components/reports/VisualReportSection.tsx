'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  Square,
  Image,
  FileImage,
  Eye,
  ZoomIn,
} from 'lucide-react';

interface VisualFinding {
  id: string;
  title: string;
  thumbnail: string; // Would be actual image path
  type: 'heatmap' | 'segmentation' | 'annotation' | 'original';
  description: string;
  measurements?: string[];
  confidence?: number;
}

interface VisualReportSectionProps {
  modality: string;
  findings?: VisualFinding[];
  onImageClick?: (finding: VisualFinding) => void;
}

// Generate mock visual findings
function generateMockVisuals(modality: string): VisualFinding[] {
  const baseVisuals: VisualFinding[] = [
    {
      id: 'original',
      title: 'Original Image',
      thumbnail: '/placeholder-ct.svg',
      type: 'original',
      description: 'Unprocessed medical image as acquired from scanner',
    },
  ];

  switch (modality.toUpperCase()) {
    case 'CT':
      return [
        ...baseVisuals,
        {
          id: 'heatmap-1',
          title: 'AI Attention Heatmap',
          thumbnail: '/placeholder-ct.svg',
          type: 'heatmap',
          description: 'AI-generated attention map highlighting regions of interest. Red areas indicate highest focus.',
          confidence: 0.94,
        },
        {
          id: 'seg-lungs',
          title: 'Lung Segmentation',
          thumbnail: '/placeholder-ct.svg',
          type: 'segmentation',
          description: 'Automated lung field segmentation with volumetric analysis',
          measurements: ['Left Lung: 2.4L', 'Right Lung: 2.8L'],
        },
        {
          id: 'seg-nodule',
          title: 'Nodule Detection',
          thumbnail: '/placeholder-ct.svg',
          type: 'annotation',
          description: 'AI-detected pulmonary nodule with measurement overlay',
          measurements: ['Size: 11.2 x 9.8 mm', 'Volume: 1.4 cc', 'Attenuation: 45 HU'],
          confidence: 0.97,
        },
        {
          id: 'seg-cardiac',
          title: 'Cardiac Silhouette',
          thumbnail: '/placeholder-ct.svg',
          type: 'segmentation',
          description: 'Heart boundary segmentation for CTR calculation',
          measurements: ['Transverse: 13.2 cm', 'CTR: 0.48 (Normal)'],
        },
      ];
    case 'MRI':
      return [
        ...baseVisuals,
        {
          id: 'flair-lesions',
          title: 'FLAIR Lesion Map',
          thumbnail: '/placeholder-ct.svg',
          type: 'heatmap',
          description: 'T2/FLAIR hyperintensity probability map',
          confidence: 0.91,
        },
        {
          id: 'brain-seg',
          title: 'Brain Segmentation',
          thumbnail: '/placeholder-ct.svg',
          type: 'segmentation',
          description: 'Automated brain parenchyma segmentation',
          measurements: ['Brain Volume: 1400 cc', 'BPF: 0.82'],
        },
        {
          id: 'wm-lesions',
          title: 'WM Lesion Annotation',
          thumbnail: '/placeholder-ct.svg',
          type: 'annotation',
          description: 'White matter lesion detection and counting',
          measurements: ['Total Lesions: 17', 'Total Volume: 3.2 cc'],
          confidence: 0.89,
        },
      ];
    case 'XRAY':
    case 'X-RAY':
      return [
        ...baseVisuals,
        {
          id: 'lung-fields',
          title: 'Lung Field Analysis',
          thumbnail: '/placeholder-ct.svg',
          type: 'segmentation',
          description: 'Bilateral lung field segmentation',
        },
        {
          id: 'fracture-detect',
          title: 'Fracture Detection',
          thumbnail: '/placeholder-ct.svg',
          type: 'annotation',
          description: 'AI-detected fracture with alignment measurements',
          measurements: ['Angulation: 20°', 'Shortening: 4 mm'],
          confidence: 0.97,
        },
        {
          id: 'bone-overlay',
          title: 'Bone Alignment',
          thumbnail: '/placeholder-ct.svg',
          type: 'heatmap',
          description: 'Bone alignment analysis overlay',
        },
      ];
    case 'ULTRASOUND':
    case 'US':
      return [
        ...baseVisuals,
        {
          id: 'liver-seg',
          title: 'Liver Segmentation',
          thumbnail: '/placeholder-ct.svg',
          type: 'segmentation',
          description: 'Hepatic boundary delineation',
          measurements: ['Span: 15.4 cm', 'Grade 2 Steatosis'],
        },
        {
          id: 'echogenicity',
          title: 'Echogenicity Map',
          thumbnail: '/placeholder-ct.svg',
          type: 'heatmap',
          description: 'Tissue echogenicity comparison map',
          confidence: 0.86,
        },
        {
          id: 'keyframe',
          title: 'Selected Keyframe',
          thumbnail: '/placeholder-ct.svg',
          type: 'original',
          description: 'AI-selected best diagnostic frame from cine loop',
        },
      ];
    default:
      return baseVisuals;
  }
}

export default function VisualReportSection({
  modality,
  findings,
  onImageClick,
}: VisualReportSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const visuals = findings || generateMockVisuals(modality);
  const currentVisual = visuals[currentIndex];

  const typeIcons = {
    original: Image,
    heatmap: Flame,
    segmentation: Layers,
    annotation: Square,
  };

  const typeColors = {
    original: 'from-slate-500 to-slate-400',
    heatmap: 'from-red-500 to-orange-400',
    segmentation: 'from-blue-500 to-cyan-400',
    annotation: 'from-purple-500 to-pink-400',
  };

  const Icon = typeIcons[currentVisual.type];

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeColors[currentVisual.type]} flex items-center justify-center`}>
            <FileImage className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Visual Report Outputs</h3>
            <p className="text-sm text-slate-400">AI-generated visual annotations and analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setLightboxOpen(true)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Viewer */}
      <div className="relative aspect-video bg-black">
        {/* Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
            {/* Mock medical image with overlay */}
            <div className="w-3/4 h-3/4 rounded-lg bg-slate-800 relative overflow-hidden">
              {/* Simulated image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full bg-gradient-radial from-slate-600 via-slate-700 to-slate-800 relative">
                  {/* Simulated anatomy */}
                  <div className="absolute inset-12 rounded-full bg-slate-500/30" />
                  
                  {/* Overlay based on type */}
                  {currentVisual.type === 'heatmap' && (
                    <div 
                      className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(255,0,0,0.6) 0%, rgba(255,165,0,0.3) 50%, transparent 70%)',
                      }}
                    />
                  )}
                  {currentVisual.type === 'segmentation' && (
                    <>
                      <div className="absolute top-1/4 left-1/4 w-20 h-24 border-2 border-blue-400 rounded-full opacity-60" />
                      <div className="absolute top-1/4 right-1/4 w-20 h-24 border-2 border-cyan-400 rounded-full opacity-60" />
                    </>
                  )}
                  {currentVisual.type === 'annotation' && (
                    <>
                      <div className="absolute top-1/3 right-1/4 w-8 h-8 border-2 border-yellow-400 rounded-lg" />
                      <div className="absolute top-[30%] right-[22%] text-yellow-400 text-[10px] font-bold bg-black/50 px-1 rounded">
                        11.2mm
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Type Badge */}
              <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${typeColors[currentVisual.type]}`}>
                <Icon className="w-3 h-3" />
                {currentVisual.type.charAt(0).toUpperCase() + currentVisual.type.slice(1)}
              </div>

              {/* Confidence Badge */}
              {currentVisual.confidence && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/70 text-green-400 text-xs font-bold">
                  {Math.round(currentVisual.confidence * 100)}% Confidence
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : visuals.length - 1))}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentIndex((i) => (i < visuals.length - 1 ? i + 1 : 0))}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-white text-sm">
          {currentIndex + 1} / {visuals.length}
        </div>
      </div>

      {/* Image Info */}
      <div className="p-4 border-t border-slate-700">
        <h4 className="font-semibold text-white mb-1">{currentVisual.title}</h4>
        <p className="text-sm text-slate-400 mb-3">{currentVisual.description}</p>
        
        {currentVisual.measurements && (
          <div className="flex flex-wrap gap-2">
            {currentVisual.measurements.map((m, i) => (
              <span key={i} className="px-2 py-1 rounded-lg bg-slate-800 text-cyan-300 text-xs font-mono">
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      <div className="p-4 pt-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {visuals.map((visual, index) => {
            const ThumbIcon = typeIcons[visual.type];
            return (
              <button
                key={visual.id}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all relative group ${
                  index === currentIndex
                    ? 'border-teal-500 ring-2 ring-teal-500/30'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
              >
                {/* Thumbnail background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${typeColors[visual.type]} opacity-30`} />
                
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <ThumbIcon className="w-6 h-6 text-white/70" />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>

                {/* Active indicator */}
                {index === currentIndex && (
                  <div className="absolute bottom-1 left-1 right-1 h-0.5 bg-teal-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large image view */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[500px] h-[500px] rounded-lg bg-slate-800 relative">
                  {/* Similar to above but larger */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-96 h-96 rounded-full bg-gradient-radial from-slate-600 via-slate-700 to-slate-800" />
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
              >
                ✕
              </button>

              {/* Image info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-xl font-bold text-white mb-2">{currentVisual.title}</h3>
                <p className="text-slate-300">{currentVisual.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
