import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Viewer Store
interface ViewerState {
  currentStudyId: string | null;
  currentSlice: number;
  totalSlices: number;
  zoom: number;
  pan: { x: number; y: number };
  windowPreset: string;
  showHeatmap: boolean;
  showSegmentation: boolean;
  selectedTool: 'pan' | 'zoom' | 'ruler' | 'marker';
  
  setStudy: (studyId: string, totalSlices: number) => void;
  setSlice: (slice: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setWindowPreset: (preset: string) => void;
  toggleHeatmap: () => void;
  toggleSegmentation: () => void;
  setTool: (tool: 'pan' | 'zoom' | 'ruler' | 'marker') => void;
  reset: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  currentStudyId: null,
  currentSlice: 1,
  totalSlices: 1,
  zoom: 1,
  pan: { x: 0, y: 0 },
  windowPreset: 'Lung',
  showHeatmap: false,
  showSegmentation: false,
  selectedTool: 'pan',
  
  setStudy: (studyId, totalSlices) =>
    set({ currentStudyId: studyId, totalSlices, currentSlice: Math.floor(totalSlices / 2) }),
  setSlice: (slice) => set({ currentSlice: slice }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  setWindowPreset: (preset) => set({ windowPreset: preset }),
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  toggleSegmentation: () => set((state) => ({ showSegmentation: !state.showSegmentation })),
  setTool: (tool) => set({ selectedTool: tool }),
  reset: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
}));

// Chat Store
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  imageContext?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
        },
      ],
    })),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [] }),
}));

// Upload Store
interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

interface UploadState {
  files: UploadFile[];
  modality: 'ct' | 'ultrasound';
  addFiles: (files: UploadFile[]) => void;
  updateFile: (id: string, updates: Partial<UploadFile>) => void;
  removeFile: (id: string) => void;
  setModality: (modality: 'ct' | 'ultrasound') => void;
  clearFiles: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [],
  modality: 'ct',
  addFiles: (files) => set((state) => ({ files: [...state.files, ...files] })),
  updateFile: (id, updates) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
  removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  setModality: (modality) => set({ modality }),
  clearFiles: () => set({ files: [] }),
}));
