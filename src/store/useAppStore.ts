import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Project, Generation, Edit, BrushStroke } from '../types';
import { Language } from '../i18n/translations';

export interface Board {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  imageIds: string[];
}

interface AppState {
  // Current project
  currentProject: Project | null;
  
  // Boards management
  boards: Board[];
  
  // Canvas state
  canvasImage: string | null;
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  
  // Upload state
  uploadedImages: string[];
  editReferenceImages: string[];
  
  // Brush strokes for painting masks
  brushStrokes: BrushStroke[];
  brushSize: number;
  showMasks: boolean;
  
  // Generation state
  isGenerating: boolean;
  currentPrompt: string;
  temperature: number;
  seed: number | null;
  
  // History and variants
  selectedGenerationId: string | null;
  selectedEditId: string | null;
  showHistory: boolean;
  
  // Panel visibility
  showPromptPanel: boolean;
  
  // UI state
  selectedTool: 'generate' | 'edit' | 'mask';
  
  // Language
  language: Language;
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  setCanvasImage: (url: string | null) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number; y: number }) => void;
  
  addUploadedImage: (url: string) => void;
  removeUploadedImage: (index: number) => void;
  clearUploadedImages: () => void;
  
  addEditReferenceImage: (url: string) => void;
  removeEditReferenceImage: (index: number) => void;
  clearEditReferenceImages: () => void;
  
  addBrushStroke: (stroke: BrushStroke) => void;
  clearBrushStrokes: () => void;
  setBrushSize: (size: number) => void;
  setShowMasks: (show: boolean) => void;
  
  setIsGenerating: (generating: boolean) => void;
  setCurrentPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
  setSeed: (seed: number | null) => void;
  
  addGeneration: (generation: Generation) => void;
  addEdit: (edit: Edit) => void;
  selectGeneration: (id: string | null) => void;
  selectEdit: (id: string | null) => void;
  setShowHistory: (show: boolean) => void;
  
  setShowPromptPanel: (show: boolean) => void;
  
  setSelectedTool: (tool: 'generate' | 'edit' | 'mask') => void;
  
  setLanguage: (language: Language) => void;
  
  // API Key state
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  apiKeyError: string | null;
  setApiKeyError: (error: string | null) => void;
  
  // Boards actions
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteBoard: (boardId: string) => void;
  addImageToBoard: (boardId: string, imageId: string) => void;
  removeImageFromBoard: (boardId: string, imageId: string) => void;
  moveImageToBoard: (targetBoardId: string, imageId: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
      // Initial state
      currentProject: null,
      
      boards: [
        {
          id: 'default',
          name: 'My Creations',
          description: 'All your generated images',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          imageIds: []
        }
      ],
      
      canvasImage: null,
      canvasZoom: 1,
      canvasPan: { x: 0, y: 0 },
      
      uploadedImages: [],
      editReferenceImages: [],
      
      brushStrokes: [],
      brushSize: 20,
      showMasks: true,
      
      isGenerating: false,
      currentPrompt: '',
      temperature: 0.7,
      seed: null,
      
      selectedGenerationId: null,
      selectedEditId: null,
      showHistory: false,
      
      showPromptPanel: true,
      
      selectedTool: 'generate',
      
      language: (typeof localStorage !== 'undefined' && localStorage.getItem('ai-pod-language') as Language) || 'en',
      
      // API Key state
      apiKey: null,
      apiKeyError: null,
      
      // Actions
      setCurrentProject: (project) => set({ currentProject: project }),
      setCanvasImage: (url) => set({ canvasImage: url }),
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      setCanvasPan: (pan) => set({ canvasPan: pan }),
      
      addUploadedImage: (url) => set((state) => ({ 
        uploadedImages: [...state.uploadedImages, url] 
      })),
      removeUploadedImage: (index) => set((state) => ({ 
        uploadedImages: state.uploadedImages.filter((_, i) => i !== index) 
      })),
      clearUploadedImages: () => set({ uploadedImages: [] }),
      
      addEditReferenceImage: (url) => set((state) => ({ 
        editReferenceImages: [...state.editReferenceImages, url] 
      })),
      removeEditReferenceImage: (index) => set((state) => ({ 
        editReferenceImages: state.editReferenceImages.filter((_, i) => i !== index) 
      })),
      clearEditReferenceImages: () => set({ editReferenceImages: [] }),
      
      addBrushStroke: (stroke) => set((state) => ({ 
        brushStrokes: [...state.brushStrokes, stroke] 
      })),
      clearBrushStrokes: () => set({ brushStrokes: [] }),
      setBrushSize: (size) => set({ brushSize: size }),
      setShowMasks: (show) => set({ showMasks: show }),
      
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
      setTemperature: (temp) => set({ temperature: temp }),
      setSeed: (seed) => set({ seed: seed }),
      
      addGeneration: (generation) => set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          generations: [...state.currentProject.generations, generation],
          updatedAt: Date.now()
        } : null
      })),
      
      addEdit: (edit) => set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          edits: [...state.currentProject.edits, edit],
          updatedAt: Date.now()
        } : null
      })),
      
      selectGeneration: (id) => set({ selectedGenerationId: id }),
      selectEdit: (id) => set({ selectedEditId: id }),
      setShowHistory: (show) => set({ showHistory: show }),
      
      setShowPromptPanel: (show) => set({ showPromptPanel: show }),
      
      setSelectedTool: (tool) => set({ selectedTool: tool }),
      
      setLanguage: (language) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('ai-pod-language', language);
        }
        set({ language: language });
      },
      
      setApiKey: (key) => set({ apiKey: key }),
      setApiKeyError: (error) => set({ apiKeyError: error }),
      
      // Boards actions
      setBoards: (boards) => set({ boards }),
      
      addBoard: (board) => set((state) => ({
        boards: [...state.boards, board]
      })),
      
      updateBoard: (boardId, updates) => set((state) => ({
        boards: state.boards.map(b =>
          b.id === boardId
            ? { ...b, ...updates, updatedAt: Date.now() }
            : b
        )
      })),
      
      deleteBoard: (boardId) => set((state) => ({
        boards: state.boards.filter(b => b.id !== boardId)
      })),
      
      addImageToBoard: (boardId, imageId) => set((state) => ({
        boards: state.boards.map(b =>
          b.id === boardId
            ? { ...b, imageIds: [...new Set([...b.imageIds, imageId])], updatedAt: Date.now() }
            : b
        )
      })),
      
      removeImageFromBoard: (boardId, imageId) => set((state) => ({
        boards: state.boards.map(b =>
          b.id === boardId
            ? { ...b, imageIds: b.imageIds.filter(id => id !== imageId), updatedAt: Date.now() }
            : b
        )
      })),
      
      moveImageToBoard: (targetBoardId, imageId) => set((state) => ({
        boards: state.boards.map(b => {
          if (b.id === targetBoardId) {
            return { ...b, imageIds: [...new Set([...b.imageIds, imageId])], updatedAt: Date.now() };
          } else {
            return { ...b, imageIds: b.imageIds.filter(id => id !== imageId), updatedAt: Date.now() };
          }
        })
      })),
      }),
      {
        name: 'ai-pod-storage',
        partialize: (state) => ({
          currentProject: state.currentProject,
          boards: state.boards,
          language: state.language,
          apiKey: state.apiKey,
          brushSize: state.brushSize,
          temperature: state.temperature,
          selectedTool: state.selectedTool,
        }),
      }
    ),
    { name: 'ai-studio-pro-store' }
  )
);