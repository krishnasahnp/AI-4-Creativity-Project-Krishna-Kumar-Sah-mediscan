export interface Study {
  id: string;
  description: string;
  modality: string;
  study_date: string;
  series_count: number;
  image_count: number;
  created_at: string;
  status: string;
  patient: {
    patient_name: string;
    patient_id: string;
    case_priority: number;
  }
}

export interface StudyListResponse {
  items: Study[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.hostname}:8000/api/v1/studies`;
    }
    return 'http://localhost:8000/api/v1/studies';
};
  
const getHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) console.warn('No auth token found in localStorage');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
};
  
export const studyService = {
    async getStudies({ page = 1, search = '', modality = '' } = {}) {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: '20',
        });
        if (search) params.append('search', search);
        if (modality && modality !== 'all') params.append('modality', modality);
  
        const response = await fetch(`${getApiUrl()}?${params.toString()}`, {
          headers: getHeaders()
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Session expired');
        }

        if (!response.ok) throw new Error('Failed to fetch studies');
        return await response.json() as StudyListResponse;
      } catch (error) {
        console.error('Error fetching studies:', error);
        throw error;
      }
    },
  
    async getStudyById(studyId: string) {
      try {
        const response = await fetch(`${getApiUrl()}/${studyId}`, {
          headers: getHeaders()
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Session expired');
        }

        if (!response.ok) throw new Error('Failed to fetch study');
        return await response.json();
      } catch (error) {
        console.error('Error fetching study:', error);
        throw error;
      }
    },
  
    async deleteStudy(id: string) {
      try {
        const response = await fetch(`${getApiUrl()}/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });

        if (response.status === 401) {
            window.location.href = '/login';
            throw new Error('Session expired');
        }
        
        if (!response.ok) throw new Error('Failed to delete study');
        return true;
      } catch (error) {
        console.error('Error deleting study:', error);
        throw error;
      }
    },

  async updateStudyStatus(studyId: string, status: 'pending' | 'analysed' | 'reports_generated') {
    try {
      const response = await fetch(`${getApiUrl()}/${studyId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });

      if( response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired');
      }

      if (!response.ok) throw new Error('Failed to update study status');
      return await response.json();
    } catch (error) {
      console.error('Error updating study status:', error);
      throw error;
    }
  }
};
