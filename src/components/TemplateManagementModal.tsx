import React, { useState, useEffect, useMemo } from 'react';
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme } from 'emoji-picker-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { X, Plus, Edit2, Trash2, Save, FileText, Eye, EyeOff, Copy, Search, Lock } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faPalette,
  faCamera,
  faWandMagicSparkles,
  faFeatherPointed,
  faRobot,
  faMountainSun,
  faBrush,
} from '@fortawesome/free-solid-svg-icons';
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

type IconMode = 'emoji' | 'fontawesome' | 'upload';

const FONT_AWESOME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'fa:palette', label: 'Palette' },
  { value: 'fa:camera', label: 'Camera' },
  { value: 'fa:wand-magic-sparkles', label: 'Magic Wand' },
  { value: 'fa:feather-pointed', label: 'Feather' },
  { value: 'fa:robot', label: 'Robot' },
  { value: 'fa:mountain-sun', label: 'Landscape' },
  { value: 'fa:brush', label: 'Brush' },
];

const FONT_AWESOME_ICON_MAP: Record<string, IconDefinition> = {
  'fa:palette': faPalette,
  'fa:camera': faCamera,
  'fa:wand-magic-sparkles': faWandMagicSparkles,
  'fa:feather-pointed': faFeatherPointed,
  'fa:robot': faRobot,
  'fa:mountain-sun': faMountainSun,
  'fa:brush': faBrush,
};

const FONT_AWESOME_DEFAULT = FONT_AWESOME_OPTIONS[0]?.value ?? 'fa:palette';

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

const detectIconMode = (value?: string): IconMode => {
  if (!value) {
    return 'emoji';
  }
  if (value.startsWith('fa:')) {
    return 'fontawesome';
  }
  if (value.startsWith('data:image')) {
    return 'upload';
  }
  return 'emoji';
};

const renderIconVisual = (value?: string, size: 'sm' | 'md' | 'lg' = 'md'): React.ReactNode => {
  const iconSizeClass = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  const imageSizeClass = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  if (!value) {
    return <span className={iconSizeClass}>✨</span>;
  }

  if (value.startsWith('data:image')) {
    return <img src={value} alt="" className={`${imageSizeClass} object-contain`} />;
  }

  if (value.startsWith('fa:')) {
    const icon = FONT_AWESOME_ICON_MAP[value];
    if (icon) {
      return <FontAwesomeIcon icon={icon} className={iconSizeClass} />;
    }
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
  const [iconMode, setIconMode] = useState<IconMode>(detectIconMode('✨'));
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    positivePrompt: '',
    negativePrompt: '',
    categoryId: '',
    emoji: '✨',
  });
  const selectedFontAwesome = useMemo(
    () => FONT_AWESOME_OPTIONS.find((option) => option.value === formData.emoji),
    [formData.emoji]
  );
  const emojiPickerTheme = isDarkMode ? EmojiTheme.DARK : EmojiTheme.LIGHT;
  const fontAwesomeSelection =
    detectIconMode(formData.emoji) === 'fontawesome' ? formData.emoji : FONT_AWESOME_DEFAULT;
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
    if (!open) {
      setShowEmojiPicker(false);
    }
  }, [open]);

  useEffect(() => {
    if (!canManageTemplates) {
      setShowAddForm(false);
      setEditingId(null);
      setIconMode('emoji');
      setShowEmojiPicker(false);
    }
  }, [canManageTemplates]);

  // Save templates
  const saveTemplates = (temps: PromptTemplate[]) => {
    localStorage.setItem('promptTemplates', JSON.stringify(temps));
    setTemplates(temps);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      positivePrompt: '',
      negativePrompt: '',
      categoryId: '',
      emoji: '✨',
    });
    setIconMode('emoji');
    setShowEmojiPicker(false);
  };

  const handleIconModeChange = (mode: IconMode) => {
    setIconMode(mode);
    if (mode !== 'emoji') {
      setShowEmojiPicker(false);
    }
    setFormData((prev) => {
      if (mode === 'emoji') {
        const nextEmoji = detectIconMode(prev.emoji) === 'emoji' && prev.emoji ? prev.emoji : '✨';
        return { ...prev, emoji: nextEmoji };
      }
      if (mode === 'fontawesome') {
        const fallback = FONT_AWESOME_DEFAULT;
        const nextEmoji = detectIconMode(prev.emoji) === 'fontawesome' && prev.emoji ? prev.emoji : fallback;
        return { ...prev, emoji: nextEmoji };
      }
      const nextEmoji = prev.emoji?.startsWith('data:image') ? prev.emoji : '';
      return { ...prev, emoji: nextEmoji };
    });
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (result) {
        setFormData((prev) => ({ ...prev, emoji: result }));
        setIconMode('upload');
        setShowEmojiPicker(false);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleClearUploadedIcon = () => {
    setFormData((prev) => ({ ...prev, emoji: '' }));
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
      emoji: formData.emoji || '✨',
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
      emoji: template.emoji || '✨',
    });
    setIconMode(detectIconMode(template.emoji));
    setShowEmojiPicker(false);
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
            emoji: formData.emoji || '✨',
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
    setShowEmojiPicker(false);
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

  // Helper to get display text for emoji (converts fa: icons to emoji or text)
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
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                  <Input
                    placeholder={t.searchPrompts}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      'pl-10',
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
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.createTemplate}
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
                      <div className="flex items-center gap-2 mb-3">
                        <Button
                          type="button"
                          size="sm"
                          variant={iconMode === 'emoji' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => handleIconModeChange('emoji')}
                        >
                          {language === 'zh' ? '表情' : 'Emoji'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={iconMode === 'fontawesome' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => handleIconModeChange('fontawesome')}
                        >
                          Font Awesome
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={iconMode === 'upload' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => handleIconModeChange('upload')}
                        >
                          {language === 'zh' ? '上传' : 'Upload'}
                        </Button>
                      </div>

                      {iconMode === 'emoji' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={formData.emoji}
                              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                              className={cn(
                                'text-center text-2xl',
                                isDarkMode
                                  ? 'bg-gray-900/60 border-purple-500/20 text-gray-100'
                                  : 'bg-white/95 text-gray-900 border-gray-300'
                              )}
                              placeholder={language === 'zh' ? '例如：✨' : 'e.g. ✨'}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="whitespace-nowrap"
                              onClick={() => setShowEmojiPicker((prev) => !prev)}
                            >
                              {language === 'zh' ? '选择表情' : 'Choose emoji'}
                            </Button>
                          </div>
                          {showEmojiPicker && (
                            <div
                              className={cn(
                                'relative rounded-xl border shadow-lg shadow-cyan-600/10',
                                isDarkMode ? 'border-cyan-500/20 bg-gray-900/90' : 'border-cyan-200 bg-white'
                              )}
                            >
                              <EmojiPicker
                                onEmojiClick={(emojiData: EmojiClickData) => {
                                  setFormData((prev) => ({ ...prev, emoji: emojiData.emoji }));
                                  setShowEmojiPicker(false);
                                }}
                                lazyLoadEmojis
                                skinTonesDisabled
                                searchDisabled={false}
                                width="100%"
                                theme={emojiPickerTheme}
                                previewConfig={{ showPreview: false }}
                                style={{
                                  background: 'transparent',
                                  borderRadius: '12px',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {iconMode === 'fontawesome' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {FONT_AWESOME_OPTIONS.map((option) => {
                              const icon = FONT_AWESOME_ICON_MAP[option.value];
                              const isSelected = fontAwesomeSelection === option.value;
                              return (
                                <Button
                                  key={option.value}
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? 'default' : 'outline'}
                                  className="flex items-center justify-start gap-2"
                                  onClick={() => setFormData({ ...formData, emoji: option.value })}
                                >
                                  {icon ? (
                                    <FontAwesomeIcon icon={icon} className="text-lg" />
                                  ) : (
                                    <span className="text-lg">🏷️</span>
                                  )}
                                  <span className="text-sm">{option.label}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {iconMode === 'upload' && (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleIconUpload}
                            className="w-full text-xs text-[color:var(--text-secondary)] file:mr-3 file:rounded-full file:border-0 file:bg-cyan-500/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-cyan-500 hover:file:bg-cyan-500/20"
                          />
                          {formData.emoji?.startsWith('data:image') ? (
                            <div className="space-y-2">
                              <div
                                className="flex items-center justify-center rounded-lg border p-3"
                                style={{ borderColor: 'var(--surface-border)' }}
                              >
                                <img
                                  src={formData.emoji}
                                  alt="Uploaded icon"
                                  className="h-16 w-16 object-contain"
                                />
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={handleClearUploadedIcon}>
                                {language === 'zh' ? '移除图标' : 'Remove icon'}
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {language === 'zh'
                                ? '上传 PNG/JPEG/WebP/SVG 图标 (建议尺寸 64×64)'
                                : 'Upload a PNG, JPEG, WebP, or SVG icon (64×64 recommended).'}
                            </p>
                          )}
                        </div>
                      )}

                      <div
                        className="mt-3 rounded-lg border py-3 text-center"
                        style={{ borderColor: 'var(--surface-border)' }}
                      >
                        <div className="flex items-center justify-center">
                          {renderIconVisual(formData.emoji, 'lg')}
                        </div>
                        {iconMode === 'fontawesome' && selectedFontAwesome && (
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {selectedFontAwesome.label}
                          </p>
                        )}
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
