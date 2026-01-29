'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentModal({ isOpen, onAccept, onDecline }: ConsentModalProps) {
  const [checkedItems, setCheckedItems] = useState({
    dataUsage: true,
    aiLimitations: true,
    professionalReview: true,
    dataRetention: true,
  });

  const allChecked = Object.values(checkedItems).every(Boolean);

  const handleCheck = (key: keyof typeof checkedItems) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Medical AI Disclaimer & Consent</h2>
                <p className="text-white/80 text-sm">Please review before proceeding</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* AI Limitations Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-1">Important Notice</h3>
                  <p className="text-sm text-yellow-200/80">
                    This AI system is designed to assist medical professionals but is NOT a substitute 
                    for professional medical judgment. All AI-generated findings MUST be reviewed by 
                    a qualified healthcare provider before clinical decisions are made.
                  </p>
                </div>
              </div>
            </div>

            {/* Consent Items */}
            <div className="space-y-4">
              <ConsentItem
                checked={checkedItems.dataUsage}
                onChange={() => handleCheck('dataUsage')}
                title="Data Usage Agreement"
                description="I understand that uploaded medical images will be processed by AI models for analysis purposes. All data is handled in compliance with healthcare privacy regulations."
              />

              <ConsentItem
                checked={checkedItems.aiLimitations}
                onChange={() => handleCheck('aiLimitations')}
                title="AI Limitations Acknowledgment"
                description="I acknowledge that AI predictions may contain errors and should not be used as the sole basis for clinical decisions. The system provides decision support only."
              />

              <ConsentItem
                checked={checkedItems.professionalReview}
                onChange={() => handleCheck('professionalReview')}
                title="Professional Review Requirement"
                description="I agree that all AI-generated reports and findings will be reviewed, verified, and approved by a licensed medical professional before use in patient care."
              />

              <ConsentItem
                checked={checkedItems.dataRetention}
                onChange={() => handleCheck('dataRetention')}
                title="Data Retention Policy"
                description="I understand the data retention policies and that audit logs of my actions within the system will be maintained for compliance and quality assurance purposes."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3">
            <button
              onClick={onDecline}
              className="btn btn-secondary"
            >
              Decline & Logout
            </button>
            <button
              onClick={onAccept}
              disabled={!allChecked}
              className={`btn ${allChecked ? 'btn-primary' : 'opacity-50 cursor-not-allowed bg-gray-600'}`}
            >
              <CheckCircle className="w-4 h-4" />
              Accept & Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface ConsentItemProps {
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
}

function ConsentItem({ checked, onChange, title, description }: ConsentItemProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
          checked 
            ? 'bg-blue-500 border-blue-500' 
            : 'border-gray-500 group-hover:border-blue-400'
        }`}>
          {checked && (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 text-white"
              viewBox="0 0 12 12"
            >
              <path
                d="M2 6l3 3 5-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
          {title}
        </h4>
        <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
    </label>
  );
}
