export interface ClinicalFinding {
  name: string;
  description: string;
  severity: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
  location: string;
  clinicalSignificance: string;
}

export interface MedicalRecommendation {
  category: 'Immediate' | 'Follow-Up' | 'Preventive' | 'Lifestyle';
  recommendation: string;
  rationale: string;
  urgency: 'Urgent' | 'Routine' | 'Optional';
}

export interface AIAnalysisReport {
  overview: {
    scanType: string; // e.g., "CT Scan", "Image Series"
    modality: string;
    region: string;
    description: string; // "This analysis is based on a CT scan..."
    studyDate?: string;
    technique?: string;
  };
  quality: {
    score: 'Good' | 'Moderate' | 'Limited';
    confidenceImpact: 'Low' | 'Medium' | 'High';
    details: string; // "Minimal noise, consistent slices"
  };
  findings: {
    visualObservations: string[]; // Step 3
    highlightedRegions: string[]; // Step 4
    clinicalFindings: ClinicalFinding[];
  };
  measurements: {
    data: string[]; // Step 5
  };
  uncertainty: {
    confidenceScore: number; // 0-1
    explanation: string; // Step 6
  };
  patientSupport: {
    explanation: string; // Step 7: Plain language
    nextSteps: string[]; // Step 8
  };
  medicalSuggestions: {
    recommendations: MedicalRecommendation[];
    differentialDiagnosis: string[];
    additionalTests: string[];
  };
  disclaimer: string; // Step 9
}
