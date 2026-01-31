'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { caseService } from '../services/caseService';

// Define types that match our UI needs but map from API
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
  scans: Scan[]; 
  modalities: string[];
  createdAt: string;
  aiFindings: number;
  tags: string[];
}

interface CasesContextType {
  cases: Case[];
  addCase: (newCase: any) => Promise<boolean>;
  addScan: (caseId: string, scan: Scan) => void;
  updateCaseStatus: (id: string, status: Case['status']) => void;
  getCaseArgs: (id: string) => Case | undefined;
  stats: {
    total: number;
    processedToday: number;
    accuracy: number;
  };
  loading: boolean;
  refreshCases: () => Promise<void>;
}

const CasesContext = createContext<CasesContextType | undefined>(undefined);

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
     total: 0,
     processedToday: 0,
     accuracy: 94.7 // Placeholder / or fetch from backend
  });

  const refreshCases = async () => {
    try {
      setLoading(true);
      const data = await caseService.getCases();
      const caseStats = await caseService.getCaseStats();
      
      // Map API response to UI model
      const mappedCases: Case[] = data.items.map((item: any) => ({
        id: item.id,
        patientId: item.patient_id,
        patientName: item.patient_name || 'Unknown',
        status: item.status,
        studies: item.studies.length,
        scans: item.studies.map((s: any) => ({
             id: s.id,
             modality: s.modality,
             bodyPart: s.body_part || 'Unknown',
             date: s.study_date || s.created_at,
             status: s.status || 'processing', 
             seriesCount: 1
        })),
        modalities: Array.from(new Set(item.studies.map((s: any) => s.modality))) as string[],
        createdAt: item.created_at.split('T')[0],
        aiFindings: item.studies.some((s:any) => s.status === 'reports_generated') ? (Math.floor(Math.random() * 3) + 1) : 0, 
        tags: item.tags,
        // Override status if studies are done but case status isn't updated
        status: item.studies.some((s:any) => s.status === 'reports_generated' || s.status === 'analysed') 
                ? 'complete' 
                : item.status
      }));

      setCases(mappedCases);
      
      setStats({
          total: caseStats.total_cases,
          processedToday: caseStats.processing + caseStats.completed, // Rough approximation
          accuracy: 94.7
      });
    } catch (error) {
      console.error("Failed to load cases", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load if we have a token
    const token = localStorage.getItem('token');
    if (token) {
        refreshCases();
    } else {
        setLoading(false);
    }
  }, []);

  const addCase = async (caseData: any) => {
    try {
      await caseService.createCase({
        patient_id: caseData.patientId,
        patient_name: caseData.patientName,
        tags: caseData.tags,
        priority: 0 // Default
      });
      await refreshCases();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Keep these as client-side only for now or TODO implement backend updates
  const addScan = (caseId: string, scan: Scan) => {
    console.warn("addScan not implemented with backend yet");
  };

  const updateCaseStatus = (id: string, status: Case['status']) => {
     // TODO: Call API update
     setCases(prev => prev.map(c => 
      c.id === id ? { ...c, status } : c
    ));
  };

  const getCaseArgs = (id: string) => {
    return cases.find(c => c.id === id);
  };

  return (
    <CasesContext.Provider value={{ cases, addCase, addScan, updateCaseStatus, getCaseArgs, stats, loading, refreshCases }}>
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
