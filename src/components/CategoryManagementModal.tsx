import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Plus, Edit2, Trash2, FolderTree, UploadCloud, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';

interface Category {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

const MAX_ICON_SIZE_BYTES = 60 * 1024; // ~60 KB base64-safe limit for localStorage

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ open, onOpenChange }) => {
  const language = useAppStore((state) => state.language);
  const t = getTranslation(language);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('📁');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconError, setIconError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      return savedTheme !== 'light';
    }
    return document.documentElement.classList.contains('dark');
  });
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, [open, showEditModal]);

  // Load categories from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('promptCategories');
    if (stored) {
      try {
        setCategories(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    } else {
      // Initialize with default categories
      const defaultCategories: Category[] = [
        { id: 'portrait', name: language === 'zh' ? '肖像' : 'Portrait', emoji: '🧑', createdAt: Date.now() },
        { id: 'landscape', name: language === 'zh' ? '风景' : 'Landscape', emoji: '🏞️', createdAt: Date.now() },
        { id: 'product', name: language === 'zh' ? '产品' : 'Product', emoji: '📦', createdAt: Date.now() },
        { id: 'art-style', name: language === 'zh' ? '艺术风格' : 'Art Style', emoji: '🎨', createdAt: Date.now() },
        { id: 'concept', name: language === 'zh' ? '概念设计' : 'Concept Design', emoji: '🌌', createdAt: Date.now() },
        { id: 'photography', name: language === 'zh' ? '摄影' : 'Photography', emoji: '📷', createdAt: Date.now() },
        { id: 'architecture', name: language === 'zh' ? '建筑设计' : 'Architecture', emoji: '🏛️', createdAt: Date.now() },
      ];
      setCategories(defaultCategories);
      localStorage.setItem('promptCategories', JSON.stringify(defaultCategories));
    }
  }, [open, language]);

  // Save categories to localStorage
  const saveCategories = (cats: Category[]) => {
    try {
      localStorage.setItem('promptCategories', JSON.stringify(cats));
      setCategories(cats);
      setStorageError(null);
    } catch (error) {
      console.error('Failed to save promptCategories:', error);
      setStorageError(
        language === 'zh'
          ? '存储空间已满，请删除一些分类图标或清除浏览器存储。'
          : 'Storage is full. Remove some category icons or clear browser storage.'
      );
      throw error;
    }
  };

  // Open modal for create
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormEmoji('📁');
    setShowEditModal(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIconError(null);
    setStorageError(null);
  };

  // Open modal for edit
  const handleOpenEdit = (category: Category) => {
    setEditingId(category.id);
    setFormName(category.name);
    setFormEmoji(category.emoji);
    setShowEditModal(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIconError(null);
    setStorageError(null);
  };

  // Save (create or update)
  const handleSave = () => {
    if (!formName.trim()) return;
    
    try {
      if (editingId) {
        // Update existing
        const updated = categories.map(cat => 
          cat.id === editingId 
            ? { ...cat, name: formName.trim(), emoji: formEmoji }
            : cat
        );
        saveCategories(updated);
      } else {
        // Create new
        const newCategory: Category = {
          id: `cat-${Date.now()}`,
          name: formName.trim(),
          emoji: formEmoji || '📁',
          createdAt: Date.now(),
        };
        const updated = [...categories, newCategory];
        saveCategories(updated);
      }
    } catch (error) {
      // Already handled inside saveCategories; keep modal open for user to adjust
      return;
    }

    setShowEditModal(false);
    setEditingId(null);
    setFormName('');
    setFormEmoji('📁');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIconError(null);
  };

  // Cancel edit/create
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingId(null);
    setFormName('');
    setFormEmoji('📁');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processIconFile = useCallback((file: File) => {
    if (file.size > MAX_ICON_SIZE_BYTES) {
      setIconError(
        language === 'zh'
          ? `图标文件过大（最大 ${Math.round(MAX_ICON_SIZE_BYTES / 1024)}KB）。`
          : `Icon file is too large (max ${Math.round(MAX_ICON_SIZE_BYTES / 1024)}KB).`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = typeof event.target?.result === 'string' ? event.target.result : '';
      if (result) {
        setFormEmoji(result);
        setIconError(null);
      }
    };
    reader.readAsDataURL(file);
  }, [language]);

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
    setFormEmoji('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIconError(null);
  };

  // Font Awesome icons list using react-icons
  const renderIcon = (emoji: string, size: string = 'text-2xl') => {
    const fallback = <span className={size}>📁</span>;

    if (!emoji) {
      return fallback;
    }

    const imageSizeClass = (() => {
      if (size === 'text-4xl') {
        return 'h-12 w-12';
      }
      if (size === 'text-3xl') {
        return 'h-10 w-10';
      }
      if (size === 'text-lg') {
        return 'h-6 w-6';
      }
      return 'h-8 w-8';
    })();

    if (emoji.startsWith('data:image')) {
      return <img src={emoji} alt="Category icon" className={`${imageSizeClass} object-cover rounded`} />;
    }

    if (emoji.startsWith('fa:')) {
      return <span className={size}>🏷️</span>;
    }

    return <span className={size}>{emoji}</span>;
  };

  useEffect(() => {
    const handleThemeChange = () => {
      if (typeof window === 'undefined') {
        return;
      }
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme !== 'light');
        return;
      }
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    window.addEventListener('themeChange', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    handleThemeChange();

    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  // Allow pasting images directly into the modal while editing
  useEffect(() => {
    if (!showEditModal) {
      return;
    }

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      for (let index = 0; index < items.length; index += 1) {
        if (items[index].type.includes('image')) {
          const blob = items[index].getAsFile();
          if (blob) {
            if (blob.size > MAX_ICON_SIZE_BYTES) {
              setIconError(
                language === 'zh'
                  ? `粘贴的图像过大（最大 ${Math.round(MAX_ICON_SIZE_BYTES / 1024)}KB）。`
                  : `Pasted image is too large (max ${Math.round(MAX_ICON_SIZE_BYTES / 1024)}KB).`
              );
              return;
            }
            processIconFile(blob);
            event.preventDefault();
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [showEditModal, processIconFile, language]);

  // Delete category
  const handleDelete = (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    
    const updated = categories.filter(cat => cat.id !== id);
    saveCategories(updated);
  };

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 backdrop-blur-sm z-[100]"
          style={{
            backgroundColor: isDarkMode ? 'rgba(4, 6, 18, 0.7)' : 'rgba(15, 23, 42, 0.22)'
          }}
        />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-3xl h-[85vh] overflow-hidden z-[100] rounded-2xl border shadow-2xl"
          style={{
            background: 'var(--modal-surface-background)',
            borderColor: 'var(--modal-surface-border)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b bg-[var(--surface-secondary)]"
            style={{ borderColor: 'var(--surface-border-light)' }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: isDarkMode ? 'rgba(124, 58, 237, 0.18)' : 'rgba(124, 58, 237, 0.08)'
                }}
              >
                <FolderTree className="h-5 w-5" style={{ color: 'var(--primary-gradient-end)' }} />
              </div>
              <div>
                <Dialog.Title
                  className="text-lg font-semibold"
                  style={{ color: 'var(--primary-gradient-end)' }}
                >
                  {t.menuPromptCategories}
                </Dialog.Title>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {t.manageCategories}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex flex-col h-[calc(100%-80px)]">
            {/* Search and Add Button */}
            <div
              className="px-6 py-4 border-b bg-[var(--surface-primary)]"
              style={{ borderColor: 'var(--surface-border-light)' }}
            >
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" style={{ color: 'var(--text-tertiary)' }} />
                  <Input
                    placeholder={t.searchPrompts}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11"
                  />
                </div>
                <Button
                  onClick={handleOpenCreate}
                  size="icon"
                  className="h-11 w-11 rounded-full text-white shadow-sm hover:shadow-md border-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end))'
                  }}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                  <FolderTree className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {searchQuery ? t.noPromptsFound : 'No categories yet'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {searchQuery ? t.tryDifferentSearch : 'Create your first category to organize templates'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="p-4 rounded-xl border transition-colors"
                      style={{
                        background: isDarkMode ? 'rgba(38, 40, 60, 0.92)' : 'rgba(250, 251, 255, 0.94)',
                        borderColor: 'var(--surface-border)',
                        boxShadow: isDarkMode ? 'none' : '0 12px 28px rgba(15, 23, 42, 0.08)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 flex items-center justify-center rounded-lg"
                            style={{
                              background: isDarkMode ? 'rgba(56, 58, 78, 0.85)' : 'rgba(124, 58, 237, 0.08)',
                              color: 'var(--accent-emerald)'
                            }}
                          >
                            {renderIcon(category.emoji)}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {category.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              Created {new Date(category.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleOpenEdit(category)}
                            size="sm"
                            variant="ghost"
                            className="hover:bg-[var(--bg-hover)]"
                            style={{ color: 'var(--accent-cyan)' }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(category.id)}
                            size="sm"
                            variant="ghost"
                            className="hover:bg-[var(--bg-hover)]"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 border-t bg-[var(--surface-secondary)]"
              style={{ borderColor: 'var(--surface-border-light)' }}
            >
              <div className="flex justify-between items-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {filteredCategories.length} {language === 'zh' ? '个分类' : 'categories'}
                </p>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  className="hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t.ok}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Edit/Create Category Modal */}
      <Dialog.Root open={showEditModal} onOpenChange={(open) => {
        if (!open) handleCancelEdit();
      }}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 backdrop-blur-sm z-[100]"
            style={{
              backgroundColor: isDarkMode ? 'rgba(4, 6, 18, 0.72)' : 'rgba(15, 23, 42, 0.18)'
            }}
          />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl border w-full max-w-md z-[101]"
            style={{
              background: 'var(--surface-primary)',
              borderColor: 'var(--modal-surface-border)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title
                  className="text-xl font-semibold"
                  style={{ color: 'var(--primary-gradient-end)' }}
                >
                  {editingId ? (language === 'zh' ? '编辑分类' : 'Edit Category') : t.addCategory}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t.categoryEmojiLabel}
                  </label>
                  <div className="space-y-3">
                    <input
                      id="category-icon-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleIconUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="category-icon-upload"
                      onDrop={handleIconDrop}
                      onDragOver={handleIconDragOver}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all ${
                        isDarkMode
                          ? 'border-emerald-500/30 bg-black/40 hover:border-emerald-400/70 hover:bg-black/30'
                          : 'border-emerald-200 bg-white/95 hover:border-emerald-400 hover:bg-emerald-50'
                      }`}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {formEmoji?.startsWith('data:image') ? (
                        <>
                          <div
                            className="relative mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border"
                            style={{ borderColor: 'var(--surface-border)' }}
                          >
                            <img src={formEmoji} alt="Uploaded icon" className="h-full w-full object-contain" />
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
                            className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full ${
                              isDarkMode ? 'bg-emerald-500/15 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
                            }`}
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
                      <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <label htmlFor="category-icon-upload" className="cursor-pointer">
                          {language === 'zh' ? '浏览文件' : 'Browse files'}
                        </label>
                      </Button>
                      {formEmoji?.startsWith('data:image') ? (
                        <Button type="button" variant="ghost" size="sm" onClick={handleClearUploadedIcon}>
                          {language === 'zh' ? '移除图标' : 'Remove icon'}
                        </Button>
                      ) : null}
                    </div>
                    <div
                      className="flex items-center gap-3 rounded-lg border p-3"
                      style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-secondary)' }}
                    >
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-lg border"
                        style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-primary)' }}
                      >
                        {renderIcon(formEmoji || '📁', 'text-3xl')}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {language === 'zh' ? '当前图标预览' : 'Current icon preview'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {language === 'zh'
                            ? '未上传图标时将使用默认文件夹图标'
                            : 'Default folder icon is used if no image is uploaded.'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                      {language === 'zh'
                        ? '在对话框打开时可直接使用 Ctrl+V 粘贴图片'
                        : 'You can also paste an image while this dialog is open (Ctrl+V).'}
                    </p>
                    {iconError ? (
                      <p className="text-xs text-center mt-2" style={{ color: '#ef4444' }}>
                        {iconError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t.categoryNameLabel}
                  </label>
                  <Input
                    placeholder={t.enterBoardName}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && formName.trim()) handleSave();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {storageError ? (
                <div className="mb-3 rounded-lg border px-3 py-2" style={{ borderColor: 'rgba(248, 113, 113, 0.4)', background: isDarkMode ? 'rgba(248, 113, 113, 0.08)' : 'rgba(254, 226, 226, 0.6)' }}>
                  <p className="text-sm" style={{ color: '#ef4444' }}>
                    {storageError}
                  </p>
                </div>
              ) : null}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSave}
                  disabled={!formName.trim()}
                  className="flex-1 text-white shadow-md hover:shadow-lg border-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-gradient-start), var(--accent-emerald))'
                  }}
                >
                  {t.save}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  className="flex-1 hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Dialog.Root>
  );
};
