import { create } from 'zustand';
import type { PromptTemplate } from '../types';
import * as templateService from '../services/templateService';
import { useAppStore } from './useAppStore';

export type TemplateSource = 'default' | 'user';

export interface Template extends PromptTemplate {
  userId?: string;
  source?: TemplateSource;
}

interface TemplateLoadingState {
  templates: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

interface TemplateStoreState {
  templates: Template[];
  loading: TemplateLoadingState;
  error: string | null;
  activeTemplateId: string | null;
  fetchTemplates: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  createTemplate: (payload: templateService.TemplateCreateRequest) => Promise<Template>;
  updateTemplate: (id: string, payload: templateService.TemplateUpdateRequest) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  setActiveTemplate: (id: string | null) => void;
}

const initialLoadingState: TemplateLoadingState = {
  templates: false,
  create: false,
  update: false,
  delete: false,
};

const syncCustomTemplates = (templates: Template[]) => {
  const appStore = useAppStore.getState();
  if (typeof appStore.setCustomTemplates === 'function') {
    const userTemplates = templates.filter((template) => !template.isDefault);
    appStore.setCustomTemplates(userTemplates);
  }
};

export const useTemplateStore = create<TemplateStoreState>((set, get) => ({
  templates: [],
  loading: { ...initialLoadingState },
  error: null,
  activeTemplateId: null,

  fetchTemplates: async () => {
    set((state) => ({
      loading: { ...state.loading, templates: true },
      error: null,
    }));

    try {
      const data = await templateService.fetchTemplates();
      
      // Check if any templates have base64 images (for migration notification)
      const hasBase64Images = data.some((template) => 
        template.image && template.image.startsWith('data:image/')
      );
      
      if (hasBase64Images) {
        console.info('📦 Auto-migration: Converting base64 images to optimized assets...');
      }
      
      set((state) => ({
        templates: data,
        loading: { ...state.loading, templates: false },
        error: null,
      }));
      syncCustomTemplates(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load templates';
      set((state) => ({
        loading: { ...state.loading, templates: false },
        error: message,
      }));
      throw error;
    }
  },

  refreshTemplates: async () => {
    if (get().loading.templates) {
      return;
    }
    await get().fetchTemplates();
  },

  createTemplate: async (payload) => {
    set((state) => ({
      loading: { ...state.loading, create: true },
      error: null,
    }));

    try {
      const template = await templateService.createTemplate(payload);
      set((state) => {
        const templates = [template, ...state.templates];
        return {
          templates,
          loading: { ...state.loading, create: false },
          error: null,
        };
      });
      syncCustomTemplates(get().templates);
      return template;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create template';
      set((state) => ({
        loading: { ...state.loading, create: false },
        error: message,
      }));
      throw error;
    }
  },

  updateTemplate: async (id, payload) => {
    set((state) => ({
      loading: { ...state.loading, update: true },
      error: null,
    }));

    try {
      const updated = await templateService.updateTemplate(id, payload);
      set((state) => {
        const templates = state.templates.map((template) =>
          template.id === id ? { ...template, ...updated } : template
        );
        return {
          templates,
          loading: { ...state.loading, update: false },
          error: null,
        };
      });
      syncCustomTemplates(get().templates);
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update template';
      set((state) => ({
        loading: { ...state.loading, update: false },
        error: message,
      }));
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    set((state) => ({
      loading: { ...state.loading, delete: true },
      error: null,
    }));

    try {
      await templateService.deleteTemplate(id);
      set((state) => {
        const templates = state.templates.filter((template) => template.id !== id);
        const activeTemplateId = state.activeTemplateId === id ? null : state.activeTemplateId;
        return {
          templates,
          loading: { ...state.loading, delete: false },
          error: null,
          activeTemplateId,
        };
      });
      syncCustomTemplates(get().templates);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete template';
      set((state) => ({
        loading: { ...state.loading, delete: false },
        error: message,
      }));
      throw error;
    }
  },

  setActiveTemplate: (id) => {
    set({ activeTemplateId: id });
  },
}));
