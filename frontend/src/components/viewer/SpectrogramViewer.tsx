'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Play, Pause, Download } from 'lucide-react';
import { QualityIndicator } from '../ui/ConfidenceBadge';

interface SpectrogramViewerProps {
  audioUrl: string;
  spectrogramUrl?: string;
  quality?: 'good' | 'medium' | 'poor';
  duration?: number;
  onTimeUpdate?: (time: number) => void;
}

export default function SpectrogramViewer({
  audioUrl,
  spectrogramUrl,
  quality = 'good',
  duration = 0,
  onTimeUpdate,
}: SpectrogramViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const container = containerRef.current;
    if (!audio || !container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div 
      className="bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden"
      role="region"
      aria-label="Audio spectrogram viewer"
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm">Audio Waveform</h3>
          <QualityIndicator quality={quality} />
        </div>
        
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[var(--color-text-muted)]" aria-hidden="true" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 accent-blue-500"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Spectrogram display */}
      <div 
        ref={containerRef}
        className="relative h-32 bg-[var(--color-bg-tertiary)] cursor-pointer"
        onClick={handleSeek}
        role="slider"
        aria-label="Audio timeline"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={audioDuration}
      >
        {spectrogramUrl ? (
          <img 
            src={spectrogramUrl} 
            alt="Audio spectrogram" 
            className="w-full h-full object-cover"
          />
        ) : (
          // Placeholder waveform
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-end gap-0.5 h-20">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-blue-500/50 rounded-full"
                  animate={{
                    height: isPlaying 
                      ? [20, 40 + Math.random() * 40, 20]
                      : 20 + Math.sin(i * 0.3) * 15
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: isPlaying ? Infinity : 0,
                    delay: i * 0.02
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Playhead */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500"
          style={{ left: `${progressPercentage}%` }}
          animate={{ left: `${progressPercentage}%` }}
        />

        {/* Progress overlay */}
        <div 
          className="absolute inset-y-0 left-0 bg-blue-500/10"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <div className="text-sm font-mono">
            <span aria-label="Current time">{formatTime(currentTime)}</span>
            <span className="text-[var(--color-text-muted)]"> / </span>
            <span aria-label="Total duration">{formatTime(audioDuration)}</span>
          </div>
        </div>

        <button
          className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
          aria-label="Download audio"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Metadata */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span>Sample Rate: 16kHz</span>
          <span>Channels: Mono</span>
          <span>Format: WAV</span>
        </div>
      </div>
    </div>
  );
}
