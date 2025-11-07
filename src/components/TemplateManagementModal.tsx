import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { X, Plus, Edit2, Trash2, Save, FileText, Eye, EyeOff, Copy, Search, Lock, UploadCloud } from 'lucide-react';
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
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none z-10"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                  <Input
                    placeholder={t.searchPrompts}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      'pl-11',
                      isDarkMode
                        ? 'bg-gray-900/60 border-purple-500/20 text-gray-100 placeholder:text-gray-400 focus-visible:bg-gray-900/70 focus-visible:border-cyan-400/40'
                        : 'bg-white/95 text-gray-900 border-gray-300 placeholder:text-gray-500 focus-visible:bg-white focus-visible:border-cyan-400/40 focus-visible:shadow-[0_0_18px_rgba(6,182,212,0.16)]'
                    )}
                  />
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

            {/* Add/Edit Form */}
            {showAddForm && (
              <div
                className={cn(
                  'px-6 py-4 border-b max-h-[50vh] overflow-y-auto',
                  isDarkMode ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-cyan-50 border-cyan-100'
                )}
              >
                <h3
                  className={cn(
                    'text-sm font-semibold mb-4',
                    isDarkMode ? 'text-cyan-200' : 'text-cyan-600'
                  )}
                >
                  {editingId ? t.editPromptTemplate : t.createPromptTemplate}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-[260px,1fr] gap-3">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {t.templateEmojiLabel}
                      </label>
                      <div className="space-y-3">
                        <input
                          id="template-icon-upload"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleIconUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="template-icon-upload"
                          onDrop={handleIconDrop}
                          onDragOver={handleIconDragOver}
                          className={cn(
                            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all',
                            isDarkMode
                              ? 'border-emerald-500/35 bg-[rgba(9,20,26,0.75)] hover:border-emerald-400 hover:bg-[rgba(9,28,34,0.85)]'
                              : 'border-emerald-200 bg-white/95 hover:border-emerald-400 hover:bg-emerald-50'
                          )}
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {formData.emoji?.startsWith('data:image') ? (
                            <>
                              <div className="relative mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border" style={{ borderColor: 'var(--surface-border)' }}>
                                <img src={formData.emoji} alt="Uploaded icon" className="h-full w-full object-contain" />
                              </div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {language === 'zh' ? '点击或拖放以更换图标' : 'Click or drop a new icon to replace'}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {language === 'zh' ? '支持 PNG / JPEG / WebP / SVG' : 'Supports PNG, JPEG, WebP, or SVG'}
                              </p>
                            </>
                          ) : (
                            <>
                              <div
                                className={cn(
                                  'mb-3 flex h-16 w-16 items-center justify-center rounded-full',
                                  isDarkMode ? 'bg-emerald-500/15 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
                                )}
                              >
                                <UploadCloud className="h-7 w-7" />
                              </div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {language === 'zh' ? '点击或拖放上传图标' : 'Click or drag a file here'}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {language === 'zh'
                                  ? '上传 PNG / JPEG / WebP / SVG 图标（建议 64×64）'
                                  : 'Upload a PNG, JPEG, WebP, or SVG icon (64×64 recommended).'}
                              </p>
                            </>
                          )}
                        </label>
                        <div className="flex items-center justify-center gap-2">
                          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            <label htmlFor="template-icon-upload" className="cursor-pointer">
                              {language === 'zh' ? '浏览文件' : 'Browse files'}
                            </label>
                          </Button>
                          {formData.emoji?.startsWith('data:image') ? (
                            <Button type="button" variant="ghost" size="sm" onClick={handleClearUploadedIcon}>
                              {language === 'zh' ? '移除图标' : 'Remove icon'}
                            </Button>
                          ) : null}
                        </div>
                        <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                          {language === 'zh'
                            ? `最大文件大小约 ${Math.round(MAX_ICON_SIZE_BYTES / 1024)}KB`
                            : `Maximum file size about ${Math.round(MAX_ICON_SIZE_BYTES / 1024)}KB`}
                        </p>
                        {iconError ? (
                          <p className="text-xs text-center" style={{ color: '#ef4444' }}>
                            {iconError}
                          </p>
                        ) : null}
                      </div>

                      <div
                        className="mt-3 rounded-lg border py-3 text-center"
                        style={{
                          borderColor: 'var(--surface-border)',
                          background: isDarkMode ? 'rgba(12, 16, 24, 0.8)' : 'rgba(240, 249, 244, 0.6)'
                        }}
                      >
                        <div className="flex items-center justify-center">
                          {renderIconVisual(formData.emoji, 'lg')}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {t.name} *
                      </label>
                      <Input
                        placeholder="e.g., Cinematic Portrait"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={cn(
                          isDarkMode
                            ? 'bg-gray-900/60 border-purple-500/20 text-gray-100'
                            : 'bg-white/95 text-gray-900 border-gray-300'
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {t.description}
                      </label>
                      <Input
                        placeholder={t.briefDescription}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className={cn(
                          isDarkMode
                            ? 'bg-gray-900/60 border-purple-500/20 text-gray-100'
                            : 'bg-white/95 text-gray-900 border-gray-300'
                        )}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {t.templateCategoryLabel}
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{
                          background: isDarkMode ? 'var(--surface-secondary)' : 'rgba(255,255,255,0.96)',
                          borderColor: 'var(--surface-border)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <option value="">{t.uncategorized}</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {getEmojiDisplay(cat.emoji)} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {t.positivePrompt} *
                    </label>
                    <Textarea
                      placeholder="cinematic portrait, professional lighting, {prompt}"
                      value={formData.positivePrompt}
                      onChange={(e) => setFormData({ ...formData, positivePrompt: e.target.value })}
                      rows={3}
                      className={cn(
                        'resize-none',
                        isDarkMode
                          ? 'bg-gray-900/60 border-purple-500/20 text-gray-100'
                          : 'bg-white/95 text-gray-900 border-gray-300 placeholder:text-gray-500 focus-visible:bg-white focus-visible:border-cyan-400/40'
                      )}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t.usePlaceholder}</p>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {t.negativePrompt}
                    </label>
                    <Textarea
                      placeholder="blurry, low quality, distorted"
                      value={formData.negativePrompt}
                      onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
                      rows={2}
                      className={cn(
                        'resize-none',
                        isDarkMode
                          ? 'bg-gray-900/60 border-purple-500/20 text-gray-100'
                          : 'bg-white/95 text-gray-900 border-gray-300 placeholder:text-gray-500 focus-visible:bg-white focus-visible:border-cyan-400/40'
                      )}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={editingId ? handleSaveEdit : handleCreate}
                      disabled={!formData.name.trim() || !formData.positivePrompt.trim()}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingId ? t.save : t.create}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="ghost"
                      className={cn(
                        isDarkMode
                          ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                          : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5'
                      )}
                    >
                      {t.cancel}
                    </Button>
                  </div>
                </div>
              </div>
            )}

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
              <div className="flex justify-between items-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {filteredTemplates.length} {t.templates.toLowerCase()}
                </p>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  className={cn(
                    'transition-colors',
                    isDarkMode
                      ? 'text-[color:var(--text-primary)] hover:bg-white/5'
                      : 'text-[color:var(--text-primary)] hover:bg-black/5'
                  )}
                >
                  {t.ok}
                </Button>
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
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'mt-2 transition-colors',
                    isDarkMode
                      ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                      : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5'
                  )}
                  type="button"
                >
                  {t.ok}
                </Button>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
