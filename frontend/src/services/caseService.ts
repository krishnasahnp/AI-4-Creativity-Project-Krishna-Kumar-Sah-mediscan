export interface Case {
  id: string;
  patient_id: string;
  patient_name: string;
  status: 'pending' | 'in_progress' | 'complete';
  studies: any[]; // refine type if needed
  tags: string[];
  notes?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCaseData {
  patient_id: string;
  patient_name: string;
  tags?: string[];
  notes?: string;
  priority?: number;
}

export interface CaseStats {
  total_cases: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  by_modality: Record<string, number>;
}

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1/cases`;
  }
  return 'http://localhost:8000/api/v1/cases';
};

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const caseService = {
  async getCases({ page = 1, search = '', status = '', tag = '' } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (tag) params.append('tag', tag);

      const response = await fetch(`${getApiUrl()}?${params.toString()}`, {
        headers: getHeaders()
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('medivision_user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) throw new Error('Failed to fetch cases');
      return await response.json();
    } catch (error) {
      console.error('Error fetching cases:', error);
      throw error;
    }
  },

  async createCase(data: CreateCaseData) {
    try {
      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('medivision_user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      
      if (!response.ok) throw new Error('Failed to create case');
      return await response.json();
    } catch (error) {
      console.error('Error creating case:', error);
      throw error;
    }
  },

  async getCaseStats() {
    try {
      const response = await fetch(`${getApiUrl()}/stats/overview`, {
        headers: getHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to fetch case stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching case stats:', error);
      throw error;
    }
  }
};
