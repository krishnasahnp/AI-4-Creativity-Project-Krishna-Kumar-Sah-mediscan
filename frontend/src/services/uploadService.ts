export interface UploadResponse {
  study_id: string;
  case_id: string;
  modality: string;
  num_images: number;
  message: string;
}

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1/upload`;
  }
  return 'http://localhost:8000/api/v1/upload';
};

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const uploadService = {
  async uploadCT(caseId: string, files: File[], bodyPart?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('case_id', caseId);
    if (bodyPart) formData.append('body_part', bodyPart);
    
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${getApiUrl()}/ct`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  async uploadUltrasound(caseId: string, files: File[], bodyPart?: string, isVideo: boolean = false): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('is_video', String(isVideo));
    if (bodyPart) formData.append('body_part', bodyPart);
    
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${getApiUrl()}/ultrasound`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },

  getImageUrl(filePath: string): string {
    // Convert backend file path to accessible URL
    // Example: "uploads/case-id/study-id/0000_file.dcm" -> "http://localhost:8000/uploads/case-id/study-id/0000_file.dcm"
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.hostname}:8000/${filePath}`;
    }
    return `http://localhost:8000/${filePath}`;
  }
};
