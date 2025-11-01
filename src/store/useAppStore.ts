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

export interface PromptTemplate {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  positivePrompt: string;
  negativePrompt: string;
  description?: string;
  isDefault?: boolean;
  createdAt: number;
}

interface AppState {
  // Current project
  currentProject: Project | null;
  
  // Boards management
  boards: Board[];
  selectedBoardId: string | null;
  
  // Custom Templates
  customTemplates: PromptTemplate[];
  
  // Canvas state
  canvasImage: string | null;
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  
  // Upload state
  uploadedImages: string[];
  editReferenceImages: string[];
  uploadHistory: string[]; // Track all uploaded images for reuse
  
  // Brush strokes for painting masks
  brushStrokes: BrushStroke[];
  brushSize: number;
  showMasks: boolean;
  
  // Generation state
  isGenerating: boolean;
  currentPrompt: string;
  temperature: number;
  seed: number | null;
  selectedTemplate: string | null;
  
  // History and variants
  selectedGenerationId: string | null;
  selectedEditId: string | null;
  showHistory: boolean;
  
  // Panel visibility
  showPromptPanel: boolean;
  promptPanelWidth: number;
  
  // UI state
  selectedTool: 'generate' | 'edit' | 'mask';
  
  // Language
  language: Language;
  
  // Prompt History
  promptHistory: string[];
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  addToPromptHistory: (prompt: string) => void;
  deletePromptFromHistory: (index: number) => void;
  deleteGeneration: (generationId: string) => void;
  deleteEdit: (editId: string) => void;
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
  setSelectedTemplate: (template: string | null) => void;
  
  addGeneration: (generation: Generation) => void;
  addEdit: (edit: Edit) => void;
  selectGeneration: (id: string | null) => void;
  selectEdit: (id: string | null) => void;
  setShowHistory: (show: boolean) => void;
  
  setShowPromptPanel: (show: boolean) => void;
  setPromptPanelWidth: (width: number) => void;
  
  setSelectedTool: (tool: 'generate' | 'edit' | 'mask') => void;
  
  setLanguage: (language: Language) => void;
  
  // API Key state
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  apiKeyError: string | null;
  setApiKeyError: (error: string | null) => void;
  
  // Save Path state (Desktop app only)
  savePath: string | null;
  setSavePath: (path: string | null) => void;

  // Generation progress
  generationProgress: { current: number; total: number };
  setGenerationProgress: (progress: { current: number; total: number }) => void;
  lastGenerationParameters: { width: number; height: number; aspectRatio?: string } | null;
  setLastGenerationParameters: (params: { width: number; height: number; aspectRatio?: string } | null) => void;
  
  // Boards actions
  setBoards: (boards: Board[]) => void;
  setSelectedBoardId: (boardId: string | null) => void;
  addBoard: (board: Board) => void;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteBoard: (boardId: string) => void;
  addImageToBoard: (boardId: string, imageId: string) => void;
  removeImageFromBoard: (boardId: string, imageId: string) => void;
  moveImageToBoard: (targetBoardId: string, imageId: string) => void;
  
  // Custom Templates actions
  setCustomTemplates: (templates: PromptTemplate[]) => void;
  addCustomTemplate: (template: PromptTemplate) => void;
  updateCustomTemplate: (templateId: string, updates: Partial<PromptTemplate>) => void;
  deleteCustomTemplate: (templateId: string) => void;
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
      selectedBoardId: 'default',
      
      customTemplates: [],
      
      canvasImage: null,
      canvasZoom: 1,
      canvasPan: { x: 0, y: 0 },
      
      uploadedImages: [],
      editReferenceImages: [],
      uploadHistory: [], // Initialize upload history
      
      brushStrokes: [],
      brushSize: 20,
      showMasks: true,
      
      isGenerating: false,
      currentPrompt: '',
      temperature: 0.7,
      seed: null,
      selectedTemplate: null,
      
      selectedGenerationId: null,
      selectedEditId: null,
      showHistory: true,
      
      showPromptPanel: true,
  promptPanelWidth: 320,
      
      selectedTool: 'generate',
      
      language: (typeof localStorage !== 'undefined' && localStorage.getItem('ai-pod-language') as Language) || 'zh',
      
      // Prompt History
      promptHistory: [],
      
      // API Key state
      apiKey: null,
      apiKeyError: null,
      
      // Save Path state (Desktop app only)
      savePath: null,

      generationProgress: { current: 0, total: 0 },
      lastGenerationParameters: null,
      
      // Actions
      setCurrentProject: (project) => set({ currentProject: project }),
      setCanvasImage: (url) => set({ canvasImage: url }),
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      setCanvasPan: (pan) => set({ canvasPan: pan }),
      
      addUploadedImage: (url) => set((state) => {
        const exists = state.uploadedImages.includes(url);
        const appended = exists ? state.uploadedImages : [...state.uploadedImages, url];
        const limited = appended.length > 2 ? appended.slice(appended.length - 2) : appended;

        return {
          uploadedImages: limited,
          uploadHistory: state.uploadHistory.includes(url)
            ? state.uploadHistory
            : [url, ...state.uploadHistory].slice(0, 50),
        };
      }),
      removeUploadedImage: (index) => set((state) => ({ 
        uploadedImages: state.uploadedImages.filter((_, i) => i !== index) 
      })),
      clearUploadedImages: () => set({ uploadedImages: [] }),
      
      addEditReferenceImage: (url) => set((state) => {
        const exists = state.editReferenceImages.includes(url);
        const appended = exists ? state.editReferenceImages : [...state.editReferenceImages, url];
        const limited = appended.length > 2 ? appended.slice(appended.length - 2) : appended;

        return {
          editReferenceImages: limited,
          uploadHistory: state.uploadHistory.includes(url)
            ? state.uploadHistory
            : [url, ...state.uploadHistory].slice(0, 20),
        };
      }),
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
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      
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
  setPromptPanelWidth: (width) => set({ promptPanelWidth: width }),
      
      setSelectedTool: (tool) => set({ selectedTool: tool }),
      
      setLanguage: (language) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('ai-pod-language', language);
        }
        set({ language: language });
      },
      
      addToPromptHistory: (prompt) => set((state) => {
        if (!prompt.trim()) return state;
        const newHistory = [prompt, ...state.promptHistory.filter(p => p !== prompt)].slice(0, 20);
        return { promptHistory: newHistory };
      }),
      
      deletePromptFromHistory: (index) => set((state) => ({
        promptHistory: state.promptHistory.filter((_, i) => i !== index)
      })),

      deleteGeneration: (generationId) => set((state) => {
        if (!state.currentProject) {
          return {};
        }

        const generationToRemove = state.currentProject.generations.find(g => g.id === generationId);
        const updatedGenerations = state.currentProject.generations.filter(g => g.id !== generationId);
        const primaryUrl = generationToRemove?.outputAssets?.[0]?.url;

        return {
          currentProject: {
            ...state.currentProject,
            generations: updatedGenerations,
            updatedAt: Date.now()
          },
          boards: state.boards.map(board => ({
            ...board,
            imageIds: board.imageIds.filter(id => id !== generationId && id !== primaryUrl)
          })),
          selectedGenerationId: state.selectedGenerationId === generationId ? null : state.selectedGenerationId,
          canvasImage: primaryUrl && state.canvasImage === primaryUrl ? null : state.canvasImage
        };
      }),

      deleteEdit: (editId) => set((state) => {
        if (!state.currentProject) {
          return {};
        }

        const editToRemove = state.currentProject.edits.find(e => e.id === editId);
        const updatedEdits = state.currentProject.edits.filter(e => e.id !== editId);
        const primaryUrl = editToRemove?.outputAssets?.[0]?.url;

        return {
          currentProject: {
            ...state.currentProject,
            edits: updatedEdits,
            updatedAt: Date.now()
          },
          boards: state.boards.map(board => ({
            ...board,
            imageIds: board.imageIds.filter(id => id !== editId && id !== primaryUrl)
          })),
          selectedEditId: state.selectedEditId === editId ? null : state.selectedEditId,
          canvasImage: primaryUrl && state.canvasImage === primaryUrl ? null : state.canvasImage
        };
      }),
      
      setApiKey: (key) => set({ apiKey: key }),
      setApiKeyError: (error) => set({ apiKeyError: error }),
      
      setSavePath: (path) => set({ savePath: path }),

  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setLastGenerationParameters: (params) => set({ lastGenerationParameters: params }),
      
      // Boards actions
      setBoards: (boards) => set({ boards }),
      setSelectedBoardId: (boardId) => set({ selectedBoardId: boardId }),
      
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
      
      // Custom Templates actions
      setCustomTemplates: (templates) => set({ customTemplates: templates }),
      
      addCustomTemplate: (template) => set((state) => ({
        customTemplates: [template, ...state.customTemplates]
      })),
      
      updateCustomTemplate: (templateId, updates) => set((state) => ({
        customTemplates: state.customTemplates.map(t =>
          t.id === templateId ? { ...t, ...updates } : t
        )
      })),
      
      deleteCustomTemplate: (templateId) => set((state) => ({
        customTemplates: state.customTemplates.filter(t => t.id !== templateId)
      })),
      }),
      {
        name: 'ai-pod-storage',
        partialize: (state) => ({
          // Persist with smart truncation to avoid quota errors
          currentProject: state.currentProject ? {
            ...state.currentProject,
            // Limit to last 20 generations to save space
            generations: state.currentProject.generations.slice(-20),
            // Limit to last 20 edits to save space
            edits: state.currentProject.edits.slice(-20)
          } : null,
          boards: state.boards,
          customTemplates: state.customTemplates,
          promptHistory: state.promptHistory,
          language: state.language,
          apiKey: state.apiKey,
          savePath: state.savePath,
          brushSize: state.brushSize,
          temperature: state.temperature,
          selectedTool: state.selectedTool,
          selectedTemplate: state.selectedTemplate,
          uploadHistory: state.uploadHistory,
          uploadedImages: state.uploadedImages,
          editReferenceImages: state.editReferenceImages,
          promptPanelWidth: state.promptPanelWidth,
        }),
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (error) {
              // Handle quota exceeded error gracefully
              if (error instanceof Error && error.name === 'QuotaExceededError') {
                console.warn('⚠️ Storage quota exceeded. Clearing old data...');
                // Try to clear some space by removing old generations
                try {
                  const currentData = JSON.parse(localStorage.getItem(name) || '{}');
                  if (currentData.state?.currentProject) {
                    // Keep only last 10 items
                    currentData.state.currentProject.generations = currentData.state.currentProject.generations?.slice(-10) || [];
                    currentData.state.currentProject.edits = currentData.state.currentProject.edits?.slice(-10) || [];
                    localStorage.setItem(name, JSON.stringify(currentData));
                  }
                } catch (cleanupError) {
                  console.error('Failed to cleanup storage:', cleanupError);
                  // Last resort: clear all storage
                  localStorage.removeItem(name);
                }
              } else {
                console.error('Storage error:', error);
              }
            }
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    { name: 'ai-studio-pro-store' }
  )
);