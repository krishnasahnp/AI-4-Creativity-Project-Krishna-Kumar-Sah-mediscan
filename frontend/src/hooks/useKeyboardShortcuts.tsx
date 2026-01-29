'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Default viewer shortcuts
export function getViewerShortcuts(handlers: {
  nextSlice: () => void;
  prevSlice: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  toggleMask: () => void;
  toggleHeatmap: () => void;
  exportImage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  play: () => void;
  increaseWindow: () => void;
  decreaseWindow: () => void;
}): KeyboardShortcut[] {
  return [
    // Navigation
    { key: 'ArrowUp', action: handlers.prevSlice, description: 'Previous slice', category: 'Navigation' },
    { key: 'ArrowDown', action: handlers.nextSlice, description: 'Next slice', category: 'Navigation' },
    { key: 'ArrowLeft', action: handlers.prevSlice, description: 'Previous slice', category: 'Navigation' },
    { key: 'ArrowRight', action: handlers.nextSlice, description: 'Next slice', category: 'Navigation' },
    { key: 'Home', action: handlers.goToFirst, description: 'Go to first slice', category: 'Navigation' },
    { key: 'End', action: handlers.goToLast, description: 'Go to last slice', category: 'Navigation' },
    { key: ' ', action: handlers.play, description: 'Play/Pause', category: 'Navigation' },

    // Zoom
    { key: '+', action: handlers.zoomIn, description: 'Zoom in', category: 'Zoom' },
    { key: '=', action: handlers.zoomIn, description: 'Zoom in', category: 'Zoom' },
    { key: '-', action: handlers.zoomOut, description: 'Zoom out', category: 'Zoom' },
    { key: '0', action: handlers.resetView, description: 'Reset view', category: 'Zoom' },

    // Overlays
    { key: 'm', action: handlers.toggleMask, description: 'Toggle mask', category: 'Overlays' },
    { key: 'h', action: handlers.toggleHeatmap, description: 'Toggle heatmap', category: 'Overlays' },

    // Window/Level
    { key: 'w', action: handlers.increaseWindow, description: 'Increase window', category: 'Window' },
    { key: 'q', action: handlers.decreaseWindow, description: 'Decrease window', category: 'Window' },

    // Export
    { key: 's', ctrl: true, action: handlers.exportImage, description: 'Export current frame', category: 'Export' },
  ];
}

// Keyboard shortcut help panel component
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    // Avoid duplicates
    if (!acc[shortcut.category].find(s => s.description === shortcut.description)) {
      acc[shortcut.category].push(shortcut);
    }
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatKey = (shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.ctrl) parts.push('⌘');
    if (shortcut.shift) parts.push('⇧');
    if (shortcut.alt) parts.push('⌥');
    
    let key = shortcut.key;
    if (key === ' ') key = 'Space';
    if (key === 'ArrowUp') key = '↑';
    if (key === 'ArrowDown') key = '↓';
    if (key === 'ArrowLeft') key = '←';
    if (key === 'ArrowRight') key = '→';
    
    parts.push(key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 p-3 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
        title="Keyboard shortcuts (press ?)"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-[var(--color-accent-primary)]" />
                  <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[var(--color-text-secondary)]">
                            {shortcut.description}
                          </span>
                          <kbd className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded text-sm font-mono">
                            {formatKey(shortcut)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
