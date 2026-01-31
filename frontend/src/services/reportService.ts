
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1/reports`;
  }
  return 'http://localhost:8000/api/v1/reports';
};

export interface Report {
  id: string;
  studyId: string;
  patient: string;
  patientName: string;
  modality: string;
  title: string;
  status: 'signed' | 'draft' | 'pending_signature';
  signedBy: string | null;
  signedAt: string | null;
  findings: string;
}

export interface CreateReportData {
  patient_id: string;
  patient_name: string;
  modality: string;
  title: string;
  study_date?: string;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const reportService = {
  async getReports({ page = 1, search = '', status = 'all' } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`${getApiUrl()}?${params.toString()}`, {
        headers: getHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch reports');
      return await response.json();
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  async createManualReport(data: CreateReportData) {
    try {
      const response = await fetch(`${getApiUrl()}/manual`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create report');
      
      return await response.json();
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  async generateReport(studyId: string) {
    try {
      const response = await fetch(`${getApiUrl()}/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ study_id: studyId, include_ai_findings: true }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || 'Failed to generate report');
      }
      
      return await response.json();
    } catch (error) {
       console.error('Error generating report:', error);
       throw error;
    }
  }
};
