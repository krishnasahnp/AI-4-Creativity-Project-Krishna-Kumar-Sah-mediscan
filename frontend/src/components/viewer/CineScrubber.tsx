'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download,
  Star,
  Clock,
} from 'lucide-react';

interface Frame {
  id: number;
  url: string;
  timestamp: number;
  isKeyframe?: boolean;
  quality?: 'good' | 'medium' | 'poor';
}

interface CineScrubberProps {
  frames: Frame[];
  currentFrame: number;
  onFrameChange: (frame: number) => void;
  fps?: number;
  onExportFrame?: (frame: number) => void;
}

export default function CineScrubber({
  frames,
  currentFrame,
  onFrameChange,
  fps = 30,
  onExportFrame,
}: CineScrubberProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = frames.length / fps;
  const currentTime = currentFrame / fps;

  // Playback control
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        onFrameChange((currentFrame + 1) % frames.length);
      }, (1000 / fps) / playbackSpeed);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentFrame, fps, playbackSpeed, frames.length, onFrameChange]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const frame = Math.floor(percentage * frames.length);
    onFrameChange(Math.max(0, Math.min(frames.length - 1, frame)));
  };

  const goToFrame = (frame: number) => {
    onFrameChange(Math.max(0, Math.min(frames.length - 1, frame)));
  };

  const goToNextKeyframe = () => {
    const nextKeyframe = frames.findIndex(
      (f, i) => i > currentFrame && f.isKeyframe
    );
    if (nextKeyframe !== -1) onFrameChange(nextKeyframe);
  };

  const goToPrevKeyframe = () => {
    for (let i = currentFrame - 1; i >= 0; i--) {
      if (frames[i].isKeyframe) {
        onFrameChange(i);
        break;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.25, 0.5, 1, 1.5, 2];

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
      {/* Timeline */}
      <div
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="relative h-16 bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer overflow-hidden mb-4"
      >
        {/* Keyframe markers */}
        {frames.map((frame, i) => 
          frame.isKeyframe && (
            <div
              key={i}
              className="absolute top-0 w-0.5 h-full bg-yellow-500"
              style={{ left: `${(i / frames.length) * 100}%` }}
            />
          )
        )}

        {/* Quality indicators */}
        <div className="absolute bottom-0 left-0 right-0 h-2 flex">
          {frames.map((frame, i) => (
            <div
              key={i}
              className={`flex-1 ${
                frame.quality === 'good' ? 'bg-green-500/30' :
                frame.quality === 'medium' ? 'bg-yellow-500/30' :
                'bg-red-500/30'
              }`}
            />
          ))}
        </div>

        {/* Playhead */}
        <motion.div
          className="absolute top-0 w-1 h-full bg-blue-500 rounded"
          style={{ left: `${(currentFrame / frames.length) * 100}%` }}
          animate={{ left: `${(currentFrame / frames.length) * 100}%` }}
          transition={{ duration: 0.1 }}
        />

        {/* Current frame thumbnail */}
        {showThumbnails && frames[currentFrame] && (
          <div 
            className="absolute -top-24 transform -translate-x-1/2 w-32 h-20 bg-black rounded overflow-hidden border-2 border-blue-500"
            style={{ left: `${(currentFrame / frames.length) * 100}%` }}
          >
            <img 
              src={frames[currentFrame].url} 
              alt={`Frame ${currentFrame}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs text-center py-0.5">
              Frame {currentFrame}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToFrame(0)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Go to start"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={goToPrevKeyframe}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Previous keyframe"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => goToFrame(currentFrame - 1)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Previous frame"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => goToFrame(currentFrame + 1)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Next frame"
          >
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            onClick={goToNextKeyframe}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Next keyframe"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => goToFrame(frames.length - 1)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Go to end"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Center - Time display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
            <span className="font-mono">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          <div className="text-sm text-[var(--color-text-muted)]">
            Frame: <span className="font-mono text-white">{currentFrame + 1}</span> / {frames.length}
          </div>

          {frames[currentFrame]?.isKeyframe && (
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              <Star className="w-4 h-4" />
              Keyframe
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Speed selector */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded px-2 py-1 text-sm"
          >
            {speedOptions.map(speed => (
              <option key={speed} value={speed}>{speed}x</option>
            ))}
          </select>

          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-2 rounded-lg transition-colors ${
              showThumbnails ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-[var(--color-bg-tertiary)]'
            }`}
            title="Show thumbnails"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onExportFrame?.(currentFrame)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
            title="Export frame as PNG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quality indicator */}
      {frames[currentFrame]?.quality && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-muted)]">Frame Quality:</span>
          <span className={`text-sm px-2 py-0.5 rounded ${
            frames[currentFrame].quality === 'good' ? 'bg-green-500/20 text-green-400' :
            frames[currentFrame].quality === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {frames[currentFrame].quality.charAt(0).toUpperCase() + frames[currentFrame].quality.slice(1)}
          </span>
        </div>
      )}
    </div>
  );
}
