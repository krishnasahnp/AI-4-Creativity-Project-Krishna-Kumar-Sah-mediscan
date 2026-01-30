'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Scan {
  id: string;
  modality: string;
  bodyPart: string;
  date: string;
  status: 'processing' | 'complete';
  seriesCount: number;
  url?: string;
}

export interface Case {
  id: string;
  patientId: string;
  patientName: string;
  status: 'pending' | 'in_progress' | 'complete';
  studies: number;
  scans: Scan[]; // Added
  modalities: string[];
  createdAt: string;
  aiFindings: number;
  tags: string[];
}

interface CasesContextType {
  cases: Case[];
  addCase: (newCase: Case) => void;
  addScan: (caseId: string, scan: Scan) => void; // Added
  updateCaseStatus: (id: string, status: Case['status']) => void;
  getCaseArgs: (id: string) => Case | undefined;
  stats: {
    total: number;
    processedToday: number;
    accuracy: number;
  };
}

// Initial Mock Data
const initialCases: Case[] = [
  {
    id: 'CASE-001',
    patientId: 'MRN-45821',
    patientName: 'John Smith',
    status: 'in_progress',
    studies: 2,
    scans: [
       { id: 'SC-001', modality: 'CT', bodyPart: 'Chest', date: '2024-01-29', status: 'complete', seriesCount: 4 },
       { id: 'SC-002', modality: 'US', bodyPart: 'Abdomen', date: '2024-01-29', status: 'processing', seriesCount: 1 }
    ],
    modalities: ['CT', 'US'],
    createdAt: '2024-01-29', // Today
    aiFindings: 3,
    tags: ['urgent', 'follow-up'],
  },
  {
    id: 'CASE-002',
    patientId: 'MRN-45820',
    patientName: 'Sarah Johnson',
    status: 'complete',
    studies: 1,
    scans: [
        { id: 'SC-003', modality: 'CT', bodyPart: 'Head', date: '2024-01-14', status: 'complete', seriesCount: 2 }
    ],
    modalities: ['CT'],
    createdAt: '2024-01-14',
    aiFindings: 1,
    tags: ['routine'],
  },
  {
    id: 'CASE-003',
    patientId: 'MRN-45819',
    patientName: 'Michael Davis',
    status: 'pending',
    studies: 3,
    scans: [
        { id: 'SC-004', modality: 'US', bodyPart: 'Thyroid', date: '2024-01-13', status: 'complete', seriesCount: 5 }
    ],
    modalities: ['CT', 'US'],
    createdAt: '2024-01-13',
    aiFindings: 0,
    tags: [],
  },
  {
    id: 'CASE-004',
    patientId: 'MRN-45818',
    patientName: 'Emily Wilson',
    status: 'complete',
    studies: 2,
    scans: [
        { id: 'SC-005', modality: 'MRI', bodyPart: 'Brain', date: '2024-01-12', status: 'complete', seriesCount: 3 }
    ],
    modalities: ['MRI'],
    createdAt: '2024-01-12',
    aiFindings: 2,
    tags: ['reviewed'],
  },
];

const CasesContext = createContext<CasesContextType | undefined>(undefined);

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [stats, setStats] = useState({
     total: 2847, // Historic
     processedToday: 156,
     accuracy: 94.7
  });

  // Calculate dynamic stats
  useEffect(() => {
    setStats(prev => ({
       ...prev,
       total: 2843 + cases.length, // Base + new
       processedToday: cases.filter(c => c.createdAt === new Date().toISOString().split('T')[0]).length + 152 // Demo base
    }));
  }, [cases]);

  const addCase = (newCase: Case) => {
    setCases(prev => [newCase, ...prev]);
  };

  const addScan = (caseId: string, scan: Scan) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          studies: c.studies + 1,
          scans: [scan, ...c.scans],
          modalities: c.modalities.includes(scan.modality) ? c.modalities : [...c.modalities, scan.modality],
          status: 'pending' // Re-open case if new scan added?
        };
      }
      return c;
    }));
  };

  const updateCaseStatus = (id: string, status: Case['status']) => {
    setCases(prev => prev.map(c => 
      c.id === id ? { ...c, status } : c
    ));
  };

  const getCaseArgs = (id: string) => {
    return cases.find(c => c.id === id);
  };

  return (
    <CasesContext.Provider value={{ cases, addCase, addScan, updateCaseStatus, getCaseArgs, stats }}>
      {children}
    </CasesContext.Provider>
  );
}

export function useCases() {
  const context = useContext(CasesContext);
  if (context === undefined) {
    throw new Error('useCases must be used within a CasesProvider');
  }
  return context;
}
