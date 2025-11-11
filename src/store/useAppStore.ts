import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Project, Generation, Edit, BrushStroke, PromptTemplate, PromptCategory } from '../types';
import { Language } from '../i18n/translations';

export type CanvasImageOrigin =
  | 'upload'
  | 'generate'
  | 'edit'
  | 'history'
  | 'asset'
  | 'upscale'
  | 'board'
  | 'manual'
  | 'workflow'
  | 'reference'
  | 'unknown';

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
  selectedBoardId: string | null;
  
  // Custom Templates
  customTemplates: PromptTemplate[];
  promptCategories: PromptCategory[];
  
  // Canvas state
  canvasImage: string | null;
  canvasImageOrigin: CanvasImageOrigin | null;
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  canvasRotation: number;
  
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
  isValidating: boolean;
  currentPrompt: string;
  temperature: number;
  seed: number | null;
  selectedTemplate: string | null;
  modelFamily: 'gemini' | 'imagen';
  modelName: string;
  availableImagenModels: string[];
  iterations: number;
  
  // History and variants
  selectedGenerationId: string | null;
  selectedEditId: string | null;
  showHistory: boolean;
  showQueue: boolean;
  
  // Panel visibility
  showPromptPanel: boolean;
  promptPanelWidth: number;
  upscaleScale: number;
  setUpscaleScale: (scale: number) => void;
  isUpscaling: boolean;
  setIsUpscaling: (value: boolean) => void;
  
  // UI state
  selectedTool: 'generate' | 'edit' | 'mask';
  activePrimarySection: 'generate' | 'canvas' | 'upscaling' | 'workflows';
  
  // Language
  language: Language;
  
  // Prompt History
  promptHistory: string[];
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  addToPromptHistory: (prompt: string) => void;
  deletePromptFromHistory: (index: number) => void;
  hydrateHistoryFromBackend: () => Promise<void>;

  // Auto-save setting
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;

  // Generation progress
  generationProgress: { current: number; total: number };
  setGenerationProgress: (progress: { current: number; total: number }) => void;
  lastGenerationParameters: { width: number; height: number; aspectRatio?: string } | null;
  setLastGenerationParameters: (params: { width: number; height: number; aspectRatio?: string } | null) => void;
  deleteGeneration: (generationId: string) => void;
  deleteEdit: (editId: string) => void;
  setCanvasImage: (url: string | null, origin?: CanvasImageOrigin) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number; y: number }) => void;
  setCanvasRotation: (rotation: number) => void;
  
  addUploadedImage: (url: string) => void;
  removeUploadedImage: (index: number) => void;
  clearUploadedImages: () => void;
  
  addEditReferenceImage: (url: string) => void;
  removeEditReferenceImage: (index: number) => void;
  clearEditReferenceImages: () => void;
  
  clearUploadHistory: () => void;
  
  addBrushStroke: (stroke: BrushStroke) => void;
  clearBrushStrokes: () => void;
  setBrushSize: (size: number) => void;
  setShowMasks: (show: boolean) => void;
  
  setIsGenerating: (generating: boolean) => void;
  setIsValidating: (validating: boolean) => void;
  setCurrentPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
  setSeed: (seed: number | null) => void;
  setSelectedTemplate: (template: string | null) => void;
  setModelFamily: (family: 'gemini' | 'imagen') => void;
  setModelName: (name: string) => void;
  setAvailableImagenModels: (models: string[]) => void;
  setIterations: (iterations: number) => void;
  
  addGeneration: (generation: Generation) => Promise<void>;
  addEdit: (edit: Edit) => void;
  selectGeneration: (id: string | null) => void;
  selectEdit: (id: string | null) => void;
  setShowHistory: (show: boolean) => void;
  setShowQueue: (show: boolean) => void;
  
  setShowPromptPanel: (show: boolean) => void;
  setPromptPanelWidth: (width: number) => void;
  
  setSelectedTool: (tool: 'generate' | 'edit' | 'mask') => void;
  setActivePrimarySection: (section: 'generate' | 'canvas' | 'upscaling' | 'workflows') => void;
  
  setLanguage: (language: Language) => void;
  
  // API Key state
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  apiKeyError: string | null;
  setApiKeyError: (error: string | null) => void;
  
  // Save Path state (Desktop app only)
  savePath: string | null;
  setSavePath: (path: string | null) => void;
  
  // Boards actions
  setBoards: (boards: Board[]) => void;
  setSelectedBoardId: (boardId: string | null) => void;
  addBoard: (board: Board) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  addImageToBoard: (boardId: string, imageId: string) => Promise<void>;
  removeImageFromBoard: (boardId: string, imageId: string) => Promise<void>;
  moveImageToBoard: (targetBoardId: string, imageId: string) => void;
  loadBoardsFromBackend: () => Promise<void>;
  favoriteImageIds: string[];
  toggleFavoriteImage: (imageId: string) => void;
  isFavoriteImage: (imageId: string) => boolean;
  
  // Custom Templates actions
  setCustomTemplates: (templates: PromptTemplate[]) => void;
  addCustomTemplate: (template: PromptTemplate) => void;
  updateCustomTemplate: (templateId: string, updates: Partial<PromptTemplate>) => void;
  deleteCustomTemplate: (templateId: string) => void;
  setPromptCategories: (categories: PromptCategory[]) => void;
  addPromptCategory: (category: PromptCategory) => void;
  updatePromptCategory: (categoryId: string, updates: Partial<PromptCategory>) => void;
  deletePromptCategory: (categoryId: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
      // Initial state
      currentProject: null,
      
      boards: [],
      selectedBoardId: null,
      favoriteImageIds: [],
      
  customTemplates: [],
  promptCategories: [],
      
  canvasImage: null,
  canvasImageOrigin: null,
      canvasZoom: 1,
      canvasPan: { x: 0, y: 0 },
  canvasRotation: 0,
      
      uploadedImages: [],
      editReferenceImages: [],
      uploadHistory: [], // Initialize upload history
      
      brushStrokes: [],
      brushSize: 20,
      showMasks: true,
      
      isGenerating: false,
      isValidating: false,
      currentPrompt: '',
      temperature: 0.7,
      seed: null,
      selectedTemplate: null,
  modelFamily: 'gemini',
  modelName: 'models/gemini-2.5-flash-image',
  availableImagenModels: ['models/imagen-3.0-generate-002'],
      iterations: 1,
      
      selectedGenerationId: null,
      selectedEditId: null,
      showHistory: true,
      showQueue: false,
      
      showPromptPanel: true,
  promptPanelWidth: 320,
  upscaleScale: 4,
  isUpscaling: false,
      
    selectedTool: 'generate',
    activePrimarySection: 'upscaling',
      
      language: (typeof localStorage !== 'undefined' && localStorage.getItem('ai-pod-language') as Language) || 'zh',
      
      // Prompt History
      promptHistory: [],
      
      // API Key state
      apiKey: null,
      apiKeyError: null,
      
      // Save Path state (Desktop app only)
      savePath: null,

      // Auto-save setting
      autoSaveEnabled: true,

      generationProgress: { current: 0, total: 0 },
      lastGenerationParameters: null,
      
      // Actions
      setCurrentProject: (project) => set({ currentProject: project }),
      setCanvasImage: (url, origin) =>
        set({
          canvasImage: url,
          canvasImageOrigin: url ? origin ?? 'unknown' : null,
        }),
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      setCanvasPan: (pan) => set({ canvasPan: pan }),
  setCanvasRotation: (rotation) => set({ canvasRotation: ((rotation % 360) + 360) % 360 }),
      
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
      
      clearUploadHistory: () => set({ uploadHistory: [] }),
      
      addBrushStroke: (stroke) => set((state) => ({ 
        brushStrokes: [...state.brushStrokes, stroke] 
      })),
      clearBrushStrokes: () => set({ brushStrokes: [] }),
      setBrushSize: (size) => set({ brushSize: size }),
      setShowMasks: (show) => set({ showMasks: show }),
      
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setIsValidating: (validating) => set({ isValidating: validating }),
      setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
      setTemperature: (temp) => set({ temperature: temp }),
      setSeed: (seed) => set({ seed: seed }),
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      setModelFamily: (family) => set((state) => {
        if (state.modelFamily === family) {
          return {};
        }
        const nextName = family === 'imagen'
          ? state.availableImagenModels[0] || 'models/imagen-3.0-generate-002'
          : 'models/gemini-2.5-flash-image';
        return { modelFamily: family, modelName: nextName };
      }),
      setModelName: (name) => set({ modelName: name }),
      setAvailableImagenModels: (models) => set((state) => {
        const nextModels = Array.isArray(models)
          ? Array.from(
              new Set(
                models
                  .filter((entry) => typeof entry === 'string')
                  .map((entry) => entry.trim())
                  .filter((entry) => entry.length > 0)
              )
            )
          : [];
        let nextModelName = state.modelName;
        if (state.modelFamily === 'imagen' && nextModels.length > 0) {
          nextModelName = nextModels.includes(state.modelName) ? state.modelName : nextModels[0];
        } else if (state.modelFamily === 'imagen' && nextModels.length === 0) {
          nextModelName = 'models/imagen-3.0-generate-002';
        }
        return {
          availableImagenModels: nextModels,
          modelName: nextModelName,
        };
      }),
      setIterations: (iterations) => set({ iterations }),
      
      addGeneration: async (generation) => {
        // Save to local store first
        set((state) => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            generations: [...state.currentProject.generations, generation],
            updatedAt: Date.now()
          } : null
        }));

        // Save to backend history asynchronously
        try {
          const { historyService } = await import('../services/historyService');
          const { useAuthStore } = await import('./useAuthStore');
          
          const token = useAuthStore.getState().token;
          if (token) {
            await historyService.createHistoryEntry(generation);
            console.log('✅ Generation saved to backend history');
          }
        } catch (error) {
          console.error('Failed to save generation to backend:', error);
          // Don't throw - we already saved locally
        }
      },
      
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
      setShowQueue: (show) => set({ showQueue: show }),
      
      setShowPromptPanel: (show) => set({ showPromptPanel: show }),
  setPromptPanelWidth: (width) => set({ promptPanelWidth: width }),
    setUpscaleScale: (scale) => set({ upscaleScale: Math.max(2, Math.min(8, Math.round(scale))) }),
    setIsUpscaling: (value) => set({ isUpscaling: value }),
      
      setSelectedTool: (tool) => set({ selectedTool: tool }),
  setActivePrimarySection: (section) => set({ activePrimarySection: section }),
      
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

      hydrateHistoryFromBackend: async () => {
        const { historyService } = await import('../services/historyService');
        const { useAuthStore } = await import('./useAuthStore');
        
        const token = useAuthStore.getState().token;
        if (!token) {
          console.warn('No auth token available, skipping history hydration');
          return;
        }

        try {
          // Fetch history from dedicated history API
          const historyResponse = await historyService.getHistory(100);
          
          const state = get();
          if (!state.currentProject) {
            console.warn('No current project, skipping history hydration');
            return;
          }

          const generations: Generation[] = historyResponse.items;

          // Merge with existing history (avoid duplicates)
          const existingGenIds = new Set(state.currentProject.generations.map(g => g.id));

          const newGenerations = generations.filter(g => !existingGenIds.has(g.id));

          // Update store with merged history
          set({
            currentProject: {
              ...state.currentProject,
              generations: [...newGenerations, ...state.currentProject.generations],
              updatedAt: Date.now(),
            },
          });

          console.log(`✅ Hydrated ${newGenerations.length} generations from backend history`);
        } catch (error) {
          console.error('Failed to hydrate history from backend:', error);
        }
      },

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
      
      setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),

  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setLastGenerationParameters: (params) => set({ lastGenerationParameters: params }),
      
      // Boards actions
      setBoards: (boards) => set({ boards }),
      setSelectedBoardId: (boardId) => set({ selectedBoardId: boardId }),
      
      // Load boards from backend
      loadBoardsFromBackend: async () => {
        try {
          const { boardService } = await import('../services/boardService');
          const backendBoards = await boardService.getBoards();
          
          // Convert backend format to frontend format
          const boards: Board[] = backendBoards.map(b => ({
            id: b.id,
            name: b.name,
            emoji: b.emoji,
            description: b.description,
            createdAt: b.created_at,
            updatedAt: b.updated_at,
            imageIds: b.image_ids
          }));
          
          // If there are boards and no board is selected (or 'default' placeholder),
          // select the first board from backend
          const currentState = get();
          const newSelectedBoardId = boards.length > 0 && (!currentState.selectedBoardId || currentState.selectedBoardId === 'default')
            ? boards[0].id 
            : currentState.selectedBoardId;
          
          set({ boards, selectedBoardId: newSelectedBoardId });
          console.log('✅ Boards loaded:', boards.length, 'Selected:', newSelectedBoardId);
        } catch (error) {
          console.error('Failed to load boards from backend:', error);
          // If failed, keep local boards
        }
      },
      
      addBoard: async (board) => {
        try {
          const { boardService } = await import('../services/boardService');
          
          // Create on backend first
          const backendBoard = await boardService.createBoard({
            name: board.name,
            emoji: board.emoji,
            description: board.description
          });
          
          // Convert and add to local state
          const newBoard: Board = {
            id: backendBoard.id,
            name: backendBoard.name,
            emoji: backendBoard.emoji,
            description: backendBoard.description,
            createdAt: backendBoard.created_at,
            updatedAt: backendBoard.updated_at,
            imageIds: backendBoard.image_ids
          };
          
          set((state) => ({
            boards: [...state.boards, newBoard]
          }));
        } catch (error) {
          console.error('Failed to create board:', error);
          // Fallback to local only
          set((state) => ({
            boards: [...state.boards, board]
          }));
          throw error;
        }
      },
      
      updateBoard: async (boardId, updates) => {
        try {
          const { boardService } = await import('../services/boardService');
          
          // Update on backend first
          const backendBoard = await boardService.updateBoard(boardId, {
            name: updates.name,
            emoji: updates.emoji,
            description: updates.description
          });
          
          // Update local state with backend response
          set((state) => ({
            boards: state.boards.map(b =>
              b.id === boardId
                ? {
                    ...b,
                    name: backendBoard.name,
                    emoji: backendBoard.emoji,
                    description: backendBoard.description,
                    updatedAt: backendBoard.updated_at
                  }
                : b
            )
          }));
        } catch (error) {
          console.error('Failed to update board:', error);
          // Fallback to local only
          set((state) => ({
            boards: state.boards.map(b =>
              b.id === boardId
                ? { ...b, ...updates, updatedAt: Date.now() }
                : b
            )
          }));
          throw error;
        }
      },
      
      deleteBoard: async (boardId) => {
        try {
          const { boardService } = await import('../services/boardService');
          
          // Delete from backend first
          await boardService.deleteBoard(boardId);
          
          // Remove from local state
          set((state) => ({
            boards: state.boards.filter(b => b.id !== boardId)
          }));
        } catch (error) {
          console.error('Failed to delete board:', error);
          throw error;
        }
      },
      
      addImageToBoard: async (boardId, imageId) => {
        try {
          const { boardService } = await import('../services/boardService');
          
          // Add image on backend
          const backendBoard = await boardService.addImagesToBoard(boardId, {
            image_ids: [imageId]
          });
          
          // Update local state with backend response
          set((state) => ({
            boards: state.boards.map(b =>
              b.id === boardId
                ? {
                    ...b,
                    imageIds: backendBoard.image_ids,
                    updatedAt: backendBoard.updated_at
                  }
                : b
            )
          }));
        } catch (error) {
          console.error('Failed to add image to board:', error);
          // Fallback to local only
          set((state) => ({
            boards: state.boards.map(b =>
              b.id === boardId
                ? {
                    ...b,
                    imageIds: b.imageIds.includes(imageId)
                      ? b.imageIds
                      : [...b.imageIds, imageId],
                    updatedAt: Date.now(),
                  }
                : b
            )
          }));
          throw error;
        }
      },
      
      removeImageFromBoard: async (boardId, imageId) => {
        try {
          const { boardService } = await import('../services/boardService');
          
          // Remove image on backend
          const backendBoard = await boardService.removeImageFromBoard(boardId, imageId);
          
          // Update local state with backend response
          set((state) => ({
            boards: state.boards.map(b =>
              b.id === boardId
                ? {
                    ...b,
                    imageIds: backendBoard.image_ids,
                    updatedAt: backendBoard.updated_at
                  }
                : b
            )
          }));
        } catch (error) {
          console.error('Failed to remove image from board:', error);
          // Fallback to local only
          set((state) => ({
            boards: state.boards.map(b =>
              b.id === boardId
                ? { ...b, imageIds: b.imageIds.filter(id => id !== imageId), updatedAt: Date.now() }
                : b
            )
          }));
          throw error;
        }
      },
      
      moveImageToBoard: (targetBoardId, imageId) => set((state) => ({
        boards: state.boards.map(b => {
          if (b.id === targetBoardId) {
            return {
              ...b,
              imageIds: b.imageIds.includes(imageId)
                ? b.imageIds
                : [...b.imageIds, imageId],
              updatedAt: Date.now(),
            };
          } else {
            return { ...b, imageIds: b.imageIds.filter(id => id !== imageId), updatedAt: Date.now() };
          }
        })
      })),

      toggleFavoriteImage: (imageId) => set((state) => {
        const exists = state.favoriteImageIds.includes(imageId);
        return {
          favoriteImageIds: exists
            ? state.favoriteImageIds.filter(id => id !== imageId)
            : [...state.favoriteImageIds, imageId]
        };
      }),

      isFavoriteImage: (imageId) => get().favoriteImageIds.includes(imageId),
      
      // Custom Templates actions
      setCustomTemplates: (templates) => set({ customTemplates: templates }),
      
      addCustomTemplate: (template) => set((state) => ({
        customTemplates: [
          {
            ...template,
            createdAt: template.createdAt ?? Date.now(),
            updatedAt: Date.now(),
          },
          ...state.customTemplates,
        ]
      })),
      
      updateCustomTemplate: (templateId, updates) => set((state) => ({
        customTemplates: state.customTemplates.map(t =>
          t.id === templateId
            ? { ...t, ...updates, updatedAt: Date.now() }
            : t
        )
      })),
      
      deleteCustomTemplate: (templateId) => set((state) => ({
        customTemplates: state.customTemplates.filter(t => t.id !== templateId)
      })),
      setPromptCategories: (categories) => set({ promptCategories: categories }),
      addPromptCategory: (category) => set((state) => ({
        promptCategories: [
          {
            ...category,
            createdAt: category.createdAt ?? Date.now(),
            updatedAt: Date.now(),
          },
          ...state.promptCategories,
        ]
      })),
      updatePromptCategory: (categoryId, updates) => set((state) => ({
        promptCategories: state.promptCategories.map((category) =>
          category.id === categoryId
            ? { ...category, ...updates, updatedAt: Date.now() }
            : category
        ),
        customTemplates: updates?.id
          ? state.customTemplates.map((template) =>
              template.categoryId === categoryId
                ? { ...template, categoryId: updates.id }
                : template
            )
          : state.customTemplates,
      })),
      deletePromptCategory: (categoryId) => set((state) => ({
        promptCategories: state.promptCategories.filter((category) => category.id !== categoryId),
        customTemplates: state.customTemplates.map((template) =>
          template.categoryId === categoryId
            ? { ...template, categoryId: undefined }
            : template
        ),
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
          promptCategories: state.promptCategories,
          promptHistory: state.promptHistory,
          language: state.language,
          apiKey: state.apiKey,
          savePath: state.savePath,
          autoSaveEnabled: state.autoSaveEnabled,
          brushSize: state.brushSize,
          temperature: state.temperature,
          selectedTool: state.selectedTool,
          activePrimarySection: state.activePrimarySection,
          selectedTemplate: state.selectedTemplate,
          canvasRotation: state.canvasRotation,
          uploadHistory: state.uploadHistory,
          uploadedImages: state.uploadedImages,
          editReferenceImages: state.editReferenceImages,
          promptPanelWidth: state.promptPanelWidth,
          favoriteImageIds: state.favoriteImageIds,
          modelFamily: state.modelFamily,
          modelName: state.modelName,
          availableImagenModels: state.availableImagenModels,
          iterations: state.iterations,
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