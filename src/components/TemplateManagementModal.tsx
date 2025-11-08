import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import {
  X, Plus, Edit2, Trash2, Save, FileText, Eye, EyeOff, Copy, Search, Lock, UploadCloud, Mic, MicOff
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { getTranslation } from '../i18n/translations';
import { cn } from '../utils/cn';
import { getDefaultTemplates } from '../lib/prompt-templates-data';
import type { PromptTemplate } from '../types';

interface TemplateManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_ICON_SIZE_BYTES = 60 * 1024; // ~60KB keeps localStorage usage modest

const resolveIsDarkMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const savedTheme = localStorage.getItem('app-theme');
  if (savedTheme === 'light') {
    return false;
  }
  if (savedTheme === 'dark') {
    return true;
  }

  return document.documentElement.classList.contains('dark');
};

const renderIconVisual = (value?: string, size: 'sm' | 'md' | 'lg' = 'md'): React.ReactNode => {
  const iconSizeClass = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  const imageSizeClass = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  if (!value) {
    return <UploadCloud className={`${imageSizeClass} text-[var(--text-secondary)]`} />;
  }

  if (value.startsWith('data:image')) {
    return <img src={value} alt="" className={`${imageSizeClass} object-contain rounded`} />;
  }

  if (value.startsWith('fa:')) {
    return <span className={iconSizeClass}>🏷️</span>;
  }

  return <span className={iconSizeClass}>{value}</span>;
};

export const TemplateManagementModal: React.FC<TemplateManagementModalProps> = ({ open, onOpenChange }) => {
  const language = useAppStore((state) => state.language);
  const t = getTranslation(language);
  const isPremiumUser = useAuthStore((state) => state.isPremiumUser);
  const user = useAuthStore((state) => state.user);
  const isTemplateAdmin = user?.username?.toLowerCase() === 'admin';
  const canManageTemplates = isPremiumUser || isTemplateAdmin;
  
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; emoji: string }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(resolveIsDarkMode);
  const wasPreviouslyOpen = useRef(open);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'zh-CN'>(() => (language === 'zh' ? 'zh-CN' : 'en-US'));
  const voiceLangWasManuallyChanged = React.useRef(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const recognitionRef = React.useRef<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    positivePrompt: '',
    negativePrompt: '',
    categoryId: '',
    emoji: '',
  });
  const [iconError, setIconError] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleThemeChange = () => {
      setIsDarkMode(resolveIsDarkMode());
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  // Load templates and categories when the modal opens
  useEffect(() => {
    if (open) {
      setIsDarkMode(resolveIsDarkMode());
      const storedTemplates = localStorage.getItem('promptTemplates');
      const storedCategories = localStorage.getItem('promptCategories');
      
      if (storedTemplates) {
        try {
          setTemplates(JSON.parse(storedTemplates));
        } catch (e) {
          console.error('Failed to load templates:', e);
        }
      } else {
        // Initialize with default templates
        const defaultTemplates = getDefaultTemplates(language);
        setTemplates(defaultTemplates);
        localStorage.setItem('promptTemplates', JSON.stringify(defaultTemplates));
      }
      
      if (storedCategories) {
        try {
          setCategories(JSON.parse(storedCategories));
        } catch (e) {
          console.error('Failed to load categories:', e);
        }
      }
    }
  }, [open, language]);

  useEffect(() => {
    if (!canManageTemplates) {
      setShowAddForm(false);
      setEditingId(null);
    }
  }, [canManageTemplates]);

  // Save templates
  const saveTemplates = (temps: PromptTemplate[]) => {
    localStorage.setItem('promptTemplates', JSON.stringify(temps));
    setTemplates(temps);
  };

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      positivePrompt: '',
      negativePrompt: '',
      categoryId: '',
      emoji: '',
    });
    setIconError(null);
  }, []);

  useEffect(() => {
    if (!open && wasPreviouslyOpen.current) {
      setShowAddForm(false);
      setEditingId(null);
      setExpandedId(null);
      resetForm();
    }

    wasPreviouslyOpen.current = open;
  }, [open, resetForm]);

  useEffect(() => {
    const SpeechRecognitionCtor = typeof window !== 'undefined'
      ? ((window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition
        || (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition)
      : undefined;

    if (!SpeechRecognitionCtor) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = voiceLang;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setSearchQuery(transcript);
        searchInputRef.current?.focus();
      }
      setListening(false);
    };
    recognition.onerror = (event: any) => {
      // Only log errors that aren't "no-speech" (user didn't speak in time)
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
      }
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort?.();
        } catch (error) {
          console.warn('Failed to stop speech recognition', error);
        }
      }
      recognitionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = voiceLang;
  }, [voiceLang]);

  useEffect(() => {
    const defaultVoiceLang = language === 'zh' ? 'zh-CN' : 'en-US';
    if (!voiceLangWasManuallyChanged.current) {
      setVoiceLang(defaultVoiceLang);
    } else if (voiceLang === defaultVoiceLang) {
      voiceLangWasManuallyChanged.current = false;
    }
  }, [language, voiceLang]);

  const startVoiceSearch = () => {
    if (!voiceSupported) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.lang = voiceLang;
      recognition.start();
      setListening(true);
    } catch (error) {
      console.error('Unable to start speech recognition', error);
      setListening(false);
    }
  };

  const stopVoiceSearch = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
      recognition.abort?.();
    } catch (error) {
      console.warn('Unable to stop speech recognition', error);
    } finally {
      setListening(false);
    }
  };

  const toggleVoiceSearch = () => {
    if (!voiceSupported) return;
    if (listening) stopVoiceSearch();
    else startVoiceSearch();
  };

  const handleVoiceLangChange = (value: string) => {
    if (value !== 'en-US' && value !== 'zh-CN') return;
    const defaultVoiceLang = language === 'zh' ? 'zh-CN' : 'en-US';
    voiceLangWasManuallyChanged.current = value !== defaultVoiceLang;
    setVoiceLang(value);
  };

  const voiceLangLabel = voiceLang === 'zh-CN' ? '中文' : 'English';

  const processIconFile = (file: File) => {
    if (file.size > MAX_ICON_SIZE_BYTES) {
      setIconError(
        language === 'zh'
          ? `图标文件过大（最大 ${Math.round(MAX_ICON_SIZE_BYTES / 1024)}KB）。`
          : `Icon file is too large (max ${Math.round(MAX_ICON_SIZE_BYTES / 1024)}KB).`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        setFormData((prev) => ({ ...prev, emoji: result }));
        setIconError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    processIconFile(file);
    event.target.value = '';
  };

  const handleIconDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processIconFile(file);
    }
    event.dataTransfer.clearData();
  };

  const handleIconDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleClearUploadedIcon = () => {
    setFormData((prev) => ({ ...prev, emoji: '' }));
    setIconError(null);
  };

  // Create new template
  const handleCreate = () => {
    if (!formData.name.trim() || !formData.positivePrompt.trim()) return;
    
    const newTemplate: PromptTemplate = {
      id: `tpl-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      positivePrompt: formData.positivePrompt.trim(),
      negativePrompt: formData.negativePrompt.trim() || undefined,
      categoryId: formData.categoryId || undefined,
      emoji: formData.emoji || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    resetForm();
    setShowAddForm(false);
  };

  // Start editing
  const handleEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      positivePrompt: template.positivePrompt,
      negativePrompt: template.negativePrompt || '',
      categoryId: template.categoryId || '',
      emoji: template.emoji || '',
    });
    setIconError(null);
    setShowAddForm(true);
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!formData.name.trim() || !formData.positivePrompt.trim() || !editingId) return;
    
    const updated = templates.map(tpl => 
      tpl.id === editingId 
        ? {
            ...tpl,
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            positivePrompt: formData.positivePrompt.trim(),
            negativePrompt: formData.negativePrompt.trim() || undefined,
            categoryId: formData.categoryId || undefined,
            emoji: formData.emoji || undefined,
            updatedAt: Date.now(),
          }
        : tpl
    );
    
    saveTemplates(updated);
    setEditingId(null);
    resetForm();
    setShowAddForm(false);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
    setShowAddForm(false);
  };

  // Delete template
  const handleDelete = (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    
    const updated = templates.filter(tpl => tpl.id !== id);
    saveTemplates(updated);
  };

  // Duplicate template
  const handleDuplicate = (template: PromptTemplate) => {
    const duplicate: PromptTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const updated = [...templates, duplicate];
    saveTemplates(updated);
  };

  // Filter templates
  const filteredTemplates = templates.filter(tpl => {
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tpl.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tpl.positivePrompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || 
                           tpl.categoryId === selectedCategoryFilter ||
                           (selectedCategoryFilter === 'uncategorized' && !tpl.categoryId);
    return matchesSearch && matchesCategory;
  });

  // Helper to present category emoji in filter chips (handles legacy values)
  const getEmojiDisplay = (emoji: string) => {
    if (!emoji) return '📁';
    if (emoji.startsWith('fa:')) {
      // For Font Awesome icons in select options, show a placeholder emoji
      return '🏷️';
    }
    if (emoji.startsWith('data:image')) {
      // For uploaded images, show a placeholder
      return '🖼️';
    }
    return emoji;
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return t.uncategorized;
    const cat = categories.find(c => c.id === categoryId);
    return cat ? `${getEmojiDisplay(cat.emoji)} ${cat.name}` : t.uncategorized;
  };

  const getFilterButtonClasses = (isSelected: boolean) => {
    if (isSelected) {
      return isDarkMode
        ? 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-200 shadow-[0_0_24px_rgba(6,182,212,0.18)]'
        : 'border border-cyan-200 bg-cyan-100 text-cyan-700 shadow-[0_12px_32px_rgba(6,182,212,0.16)]';
    }

    return isDarkMode
      ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
      : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5';
  };

  return (
    <>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 backdrop-blur-md transition-colors z-[100]",
            isDarkMode ? "bg-black/70" : "bg-black/40"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-5xl h-[90vh] overflow-hidden z-[100] rounded-2xl border transition-[box-shadow]",
            "text-[color:var(--text-primary)]",
            isDarkMode
              ? "shadow-[0_35px_80px_rgba(8,15,30,0.65)]"
              : "shadow-[0_45px_80px_rgba(15,23,42,0.18)]"
          )}
          style={{
            background: 'var(--modal-surface-background)',
            borderColor: 'var(--modal-surface-border)'
          }}
        >
          {canManageTemplates ? (
            <>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--surface-border-light)] bg-[var(--surface-secondary)]">
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  isDarkMode ? 'bg-cyan-600/20 text-cyan-300' : 'bg-cyan-100 text-cyan-600'
                )}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {t.menuTemplateManagement}
                </Dialog.Title>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {t.clickToManageTemplates}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  isDarkMode
                    ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                    : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5'
                )}
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex flex-col h-[calc(100%-80px)]">
            
            {/* Filters and Actions */}
            <div className="px-6 py-4 border-b border-[color:var(--surface-border-light)] bg-[var(--surface-primary)] space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <div
                    className={cn(
                      'relative flex h-11 items-center rounded-full border px-3 transition-colors',
                      isDarkMode
                        ? 'bg-gray-900/70 border-gray-700 hover:border-gray-500 focus-within:border-cyan-400'
                        : 'bg-white border-gray-200 hover:border-gray-400 focus-within:border-sky-500'
                    )}
                  >
                    <div className="pr-3 text-gray-400">
                      <Search className="h-[18px] w-[18px]" />
                    </div>
                    <Input
                      ref={searchInputRef}
                      placeholder={t.searchPrompts}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn(
                        'flex-1 h-full border-0 bg-transparent px-0 text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
                        isDarkMode
                          ? 'text-gray-100 placeholder:text-gray-500'
                          : 'text-gray-900 placeholder:text-gray-500'
                      )}
                    />
                    <div className="flex items-center pr-1 gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={toggleVoiceSearch}
                        disabled={!voiceSupported}
                        className={cn(
                          'h-9 w-9 rounded-full flex-shrink-0 transition-colors',
                          listening && voiceSupported
                            ? 'text-rose-400 bg-rose-500/10'
                            : isDarkMode
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
                          !voiceSupported && 'opacity-30 cursor-not-allowed'
                        )}
                        title={voiceSupported ? (listening ? (language === 'zh' ? '停止语音搜索' : 'Stop voice search') : (language === 'zh' ? '开始语音搜索' : 'Start voice search')) : (language === 'zh' ? '浏览器不支持语音搜索' : 'Voice search not supported')}
                      >
                        <svg className="h-5 w-5" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path fill="currentColor" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingId(null);
                    resetForm();
                  }}
                  size="icon"
                  className="h-11 w-11 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm hover:shadow-md border-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  onClick={() => setSelectedCategoryFilter('all')}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'transition-colors rounded-full px-4 py-2 text-sm',
                    getFilterButtonClasses(selectedCategoryFilter === 'all')
                  )}
                >
                  {t.allCategories}
                </Button>
                <Button
                  onClick={() => setSelectedCategoryFilter('uncategorized')}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'transition-colors rounded-full px-4 py-2 text-sm',
                    getFilterButtonClasses(selectedCategoryFilter === 'uncategorized')
                  )}
                >
                  {t.uncategorized}
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'transition-colors rounded-full px-4 py-2 text-sm',
                      getFilterButtonClasses(selectedCategoryFilter === cat.id)
                    )}
                  >
                    {getEmojiDisplay(cat.emoji)} {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {searchQuery ? t.noMatchingTemplates : t.noPromptTemplatesAvailable}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {searchQuery ? t.tryDifferentSearch : t.createTemplateFirstMessage}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 rounded-lg border transition-all hover:bg-[var(--bg-hover)]"
                      style={{
                        background: 'var(--surface-secondary)',
                        borderColor: 'var(--surface-border)'
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-3 flex-1">
                            <span className="flex h-10 w-10 items-center justify-center text-2xl">
                              {renderIconVisual(template.emoji)}
                            </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{template.name}</h4>
                            {template.description && (
                              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{template.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              <span>{getCategoryName(template.categoryId)}</span>
                              <span>•</span>
                              <span>Updated {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : new Date(template.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                            size="sm"
                            variant="ghost"
                            className={cn(
                              'transition-colors',
                              isDarkMode
                                ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                                : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5'
                            )}
                            title={expandedId === template.id ? t.hidePreview : t.showPreview}
                          >
                            {expandedId === template.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            onClick={() => handleDuplicate(template)}
                            size="sm"
                            variant="ghost"
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                            title={t.duplicateTemplate}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleEdit(template)}
                            size="sm"
                            variant="ghost"
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                            title={t.editTemplate}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(template.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            title={t.deleteTemplate}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {expandedId === template.id && (
                        <div
                          className="mt-3 pt-3 border-t space-y-2"
                          style={{ borderColor: 'var(--surface-border-light)' }}
                        >
                          <div>
                            <p className="text-xs font-medium text-green-400 mb-1">{t.positive}</p>
                            <p
                              className="text-sm p-2 rounded"
                              style={{
                                color: 'var(--text-secondary)',
                                background: 'var(--surface-primary)'
                              }}
                            >{template.positivePrompt}</p>
                          </div>
                          {template.negativePrompt && (
                            <div>
                              <p className="text-xs font-medium text-red-400 mb-1">{t.negative}</p>
                              <p
                                className="text-sm p-2 rounded"
                                style={{
                                  color: 'var(--text-secondary)',
                                  background: 'var(--surface-primary)'
                                }}
                              >{template.negativePrompt}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 border-t"
              style={{
                borderColor: 'var(--surface-border-light)',
                background: 'var(--surface-secondary)'
              }}
            >
              <div className="flex items-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {filteredTemplates.length} {t.templates.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
          </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
              <div
                className={cn(
                  'rounded-full p-4',
                  isDarkMode ? 'bg-purple-500/15 text-purple-200' : 'bg-purple-100 text-purple-600'
                )}
              >
                <Lock className="h-8 w-8" />
              </div>
              <Dialog.Title className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t.premiumFeatureTitle}
              </Dialog.Title>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t.premiumFeatureDescription}
              </p>
              <Button className="btn-premium" type="button">
                {t.upgradeToUnlock}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {/* Add/Edit Form Dialog */}
    <Dialog.Root open={showAddForm} onOpenChange={(open) => !open && handleCancelEdit()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 backdrop-blur-sm z-[110]" style={{ backgroundColor: isDarkMode ? 'rgba(4, 6, 18, 0.72)' : 'rgba(15, 23, 42, 0.18)' }} />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[85vh] overflow-y-auto z-[110]" style={{ background: 'var(--surface-primary)', borderColor: 'var(--modal-surface-border)', color: 'var(--text-primary)' }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold" style={{ color: 'var(--primary-gradient-end)' }}>
                {editingId ? t.editPromptTemplate : t.createPromptTemplate}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" style={{ color: 'var(--text-secondary)' }}><X className="h-5 w-5" /></Button>
              </Dialog.Close>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {language === 'zh' ? '名称 *' : 'Name *'}
                </label>
                <Input
                  placeholder={language === 'zh' ? '例如：电影肖像' : 'e.g., Cinematic Portrait'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {language === 'zh' ? '缩略图 Thumbnail' : 'Thumbnail 缩略图'}
                </label>
                <div className="space-y-2">
                  <input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setFormData({ ...formData, emoji: ev.target?.result as string });
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 text-center transition-all',
                      isDarkMode ? 'border-cyan-500/35 bg-gray-900/60 hover:border-cyan-400' : 'border-cyan-200 bg-white/95 hover:border-cyan-400'
                    )}
                  >
                    {formData.emoji?.startsWith('data:image') || formData.emoji?.startsWith('http') ? (
                      <img src={formData.emoji} alt="Thumbnail" className="h-24 w-24 object-cover rounded-lg" />
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 mb-2" style={{ color: 'var(--text-secondary)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {language === 'zh' ? '点击上传 | Click to upload' : 'Click to upload | 点击上传'}
                        </p>
                      </>
                    )}
                  </label>
                  <Input
                    placeholder={language === 'zh' ? '或输入图片URL | Or enter image URL' : 'Or enter image URL | 或输入图片URL'}
                    value={formData.emoji?.startsWith('http') ? formData.emoji : ''}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {language === 'zh' ? '分类 Category' : 'Category 分类'}
                </label>
                <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-3 py-2 rounded-lg" style={{ background: isDarkMode ? 'var(--surface-secondary)' : 'white', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}>
                  <option value="">{t.uncategorized}</option>
                  {categories.map(cat => (<option key={cat.id} value={cat.id}>{getEmojiDisplay(cat.emoji)} {cat.name}</option>))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {language === 'zh' ? '正向提示词 *' : 'Positive Prompt *'}
                </label>
                <Textarea
                  placeholder={language === 'zh' ? '电影肖像，专业打光，{prompt}' : 'cinematic portrait, professional lighting, {prompt}'}
                  value={formData.positivePrompt}
                  onChange={(e) => setFormData({ ...formData, positivePrompt: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t.usePlaceholder}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {language === 'zh' ? '负向提示词' : 'Negative Prompt'}
                </label>
                <Textarea
                  placeholder={language === 'zh' ? '模糊，低质量，扭曲' : 'blurry, low quality, distorted'}
                  value={formData.negativePrompt}
                  onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
                  rows={2}
                  className="resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button onClick={editingId ? handleSaveEdit : handleCreate} disabled={!formData.name.trim() || !formData.positivePrompt.trim()} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? t.save : t.create}
                </Button>
                <Button onClick={handleCancelEdit} variant="ghost" className="flex-1" style={{ color: 'var(--text-secondary)' }}>{t.cancel}</Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </>
  );
};
