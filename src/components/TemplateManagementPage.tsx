import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { X, Plus, Edit2, Trash2, Save, FileText, Eye, EyeOff, Copy, Search, ArrowLeft, Upload, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { cn } from '../utils/cn';
import { getDefaultTemplates } from './TemplatesView';
import type { PromptTemplate } from '../types';

interface TemplateManagementPageProps {
  onClose: () => void;
}

export const TemplateManagementPage: React.FC<TemplateManagementPageProps> = ({ onClose }) => {
  const language = useAppStore((state) => state.language);
  const t = getTranslation(language);
  
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; emoji: string }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Get theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('template-page-theme');
    return savedTheme !== 'light';
  });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    positivePrompt: '',
    negativePrompt: '',
    categoryId: '',
    emoji: '✨',
    image: '',
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('template-page-theme', newTheme ? 'dark' : 'light');
  };

  // Load templates and categories
  useEffect(() => {
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
  }, [language]);

  // Save templates
  const saveTemplates = (temps: PromptTemplate[]) => {
    try {
      const jsonString = JSON.stringify(temps);
      localStorage.setItem('promptTemplates', jsonString);
      setTemplates(temps);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert(
          language === 'zh' 
            ? '存储空间不足！请删除一些模板或使用较小的图片。'
            : 'Storage quota exceeded! Please delete some templates or use smaller images.'
        );
        console.error('LocalStorage quota exceeded. Current size:', new Blob([JSON.stringify(temps)]).size, 'bytes');
      } else {
        alert(
          language === 'zh'
            ? '保存失败：' + (error as Error).message
            : 'Save failed: ' + (error as Error).message
        );
      }
      throw error;
    }
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
      image: '',
    });
  };

  // Open modal for create
  const handleOpenCreate = () => {
    setEditingId(null);
    resetForm();
    setShowEditModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description || '',
      positivePrompt: template.positivePrompt,
      negativePrompt: template.negativePrompt || '',
      categoryId: template.categoryId || '',
      emoji: template.emoji || '✨',
      image: template.image || '',
    });
    setShowEditModal(true);
  };

  // Handle image upload with compression
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB before compression)
      if (file.size > 2 * 1024 * 1024) {
        alert(language === 'zh' ? '图片太大，请选择小于2MB的图片' : 'Image too large, please select an image smaller than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 800px width/height)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality reduction
          const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
          setFormData({ ...formData, image: compressedImage });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Save (create or update)
  const handleSave = () => {
    if (!formData.name.trim() || !formData.positivePrompt.trim()) return;
    
    try {
      if (editingId) {
        // Update existing
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
                image: formData.image || undefined,
                updatedAt: Date.now(),
              }
            : tpl
        );
        saveTemplates(updated);
      } else {
        // Create new
        const newTemplate: PromptTemplate = {
          id: `tpl-${Date.now()}`,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          positivePrompt: formData.positivePrompt.trim(),
          negativePrompt: formData.negativePrompt.trim() || undefined,
          categoryId: formData.categoryId || undefined,
          emoji: formData.emoji || '✨',
          image: formData.image || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        saveTemplates([...templates, newTemplate]);
      }
      
      handleCancelEdit();
    } catch (error) {
      // Error already handled in saveTemplates, just prevent closing modal
      console.error('Failed to save template:', error);
    }
  };

  // Cancel edit/create
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingId(null);
    resetForm();
  };

  // Delete template
  const handleDelete = (id: string) => {
    if (window.confirm(language === 'zh' ? '确定要删除这个模板吗？' : 'Are you sure you want to delete this template?')) {
      saveTemplates(templates.filter(tpl => tpl.id !== id));
    }
  };

  // Duplicate template
  const handleDuplicate = (template: PromptTemplate) => {
    const duplicated: PromptTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveTemplates([...templates, duplicated]);
  };

  // Filter templates
  const filteredTemplates = templates.filter(tpl => {
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tpl.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'all' || tpl.categoryId === selectedCategoryFilter;
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

  // Get category name
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return language === 'zh' ? '未分类' : 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category ? `${getEmojiDisplay(category.emoji)} ${category.name}` : language === 'zh' ? '未分类' : 'Uncategorized';
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 overflow-y-auto transition-colors duration-300",
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
    )}>
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-10 backdrop-blur-sm border-b transition-colors duration-300",
        isDarkMode 
          ? "bg-gray-900/95 border-gray-700/50" 
          : "bg-white/95 border-gray-200/50"
      )}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className={cn(
                  "transition-colors",
                  isDarkMode 
                    ? "text-gray-400 hover:text-gray-200" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {language === 'zh' ? '返回' : 'Back'}
              </Button>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-cyan-400" />
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-lime-400">
                  {language === 'zh' ? '模板管理' : 'Template Management'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="sm"
                className={cn(
                  "transition-colors",
                  isDarkMode 
                    ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
                title={isDarkMode 
                  ? (language === 'zh' ? '切换到浅色模式' : 'Switch to Light Mode')
                  : (language === 'zh' ? '切换到深色模式' : 'Switch to Dark Mode')
                }
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                onClick={handleOpenCreate}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === 'zh' ? '新建模板' : 'New Template'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5",
              isDarkMode ? "text-gray-400" : "text-gray-500"
            )} />
            <Input
              placeholder={language === 'zh' ? '搜索模板...' : 'Search templates...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 transition-colors",
                isDarkMode 
                  ? "bg-gray-800 border-gray-700 text-gray-100" 
                  : "bg-white border-gray-200 text-gray-900"
              )}
            />
          </div>
          <div className="w-64">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className={cn(
                "w-full px-4 py-2.5 backdrop-blur-sm border rounded-xl font-medium shadow-sm hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 cursor-pointer appearance-none bg-no-repeat bg-right pr-10",
                isDarkMode
                  ? "bg-gray-800/80 border-gray-700/60 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              )}
              style={{
                backgroundImage: `url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath fill='${isDarkMode ? '%2394a3b8' : '%236b7280'}' d='M11.293 4.293L7 8.586 2.707 4.293A1 1 0 001.293 5.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E\")`,
                backgroundPosition: 'right 0.875rem center',
                backgroundSize: '1.125rem'
              }}
            >
              <option value="all" className={isDarkMode ? "bg-gray-900 text-gray-100 py-2" : "bg-white text-gray-900 py-2"}>
                {language === 'zh' ? '所有分类' : 'All Categories'}
              </option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className={isDarkMode ? "bg-gray-900 text-gray-100 py-2" : "bg-white text-gray-900 py-2"}>
                  {getEmojiDisplay(cat.emoji)} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <FileText className={cn(
              "h-16 w-16 mx-auto mb-4",
              isDarkMode ? "text-gray-600" : "text-gray-400"
            )} />
            <p className={cn(
              "text-lg",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {searchQuery || selectedCategoryFilter !== 'all'
                ? (language === 'zh' ? '未找到匹配的模板' : 'No templates found')
                : (language === 'zh' ? '还没有模板' : 'No templates yet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={cn(
                  "p-5 rounded-lg border transition-all",
                  isDarkMode
                    ? "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-cyan-400/30"
                    : "bg-white border-gray-200 hover:bg-gray-50 hover:border-cyan-400/40 shadow-sm hover:shadow-md"
                )}
              >
                {/* Preview Image */}
                {template.image && (
                  <div className={cn(
                    "mb-4 rounded-lg overflow-hidden",
                    isDarkMode ? "bg-gray-900/50" : "bg-gray-100"
                  )}>
                    <img 
                      src={template.image} 
                      alt={template.name}
                      className="w-full h-48 object-contain"
                    />
                  </div>
                )}

                {/* Template Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.emoji || '✨'}</span>
                    <div>
                      <h3 className={cn(
                        "text-lg font-medium",
                        isDarkMode ? "text-gray-200" : "text-gray-800"
                      )}>{template.name}</h3>
                      <p className={cn(
                        "text-xs",
                        isDarkMode ? "text-gray-500" : "text-gray-600"
                      )}>
                        {getCategoryName(template.categoryId)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenEdit(template)}
                      size="sm"
                      variant="ghost"
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDuplicate(template)}
                      size="sm"
                      variant="ghost"
                      className="text-lime-400 hover:text-lime-300 hover:bg-lime-400/10"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(template.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                {template.description && (
                  <p className={cn(
                    "text-sm mb-3",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>{template.description}</p>
                )}

                {/* Prompts Preview */}
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-xs font-medium",
                        isDarkMode ? "text-gray-500" : "text-gray-600"
                      )}>
                        {language === 'zh' ? '正向提示词' : 'Positive Prompt'}
                      </span>
                      <Button
                        onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "h-6 px-2",
                          isDarkMode 
                            ? "text-gray-400 hover:text-gray-200" 
                            : "text-gray-600 hover:text-gray-900"
                        )}
                      >
                        {expandedId === template.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className={cn(
                      "text-sm p-2 rounded",
                      isDarkMode 
                        ? "text-gray-300 bg-gray-900/50" 
                        : "text-gray-700 bg-gray-100",
                      expandedId !== template.id && "line-clamp-2"
                    )}>
                      {template.positivePrompt}
                    </p>
                  </div>

                  {template.negativePrompt && (
                    <div>
                      <span className={cn(
                        "text-xs font-medium block mb-1",
                        isDarkMode ? "text-gray-500" : "text-gray-600"
                      )}>
                        {language === 'zh' ? '负向提示词' : 'Negative Prompt'}
                      </span>
                      <p className={cn(
                        "text-sm p-2 rounded",
                        isDarkMode 
                          ? "text-gray-300 bg-gray-900/50" 
                          : "text-gray-700 bg-gray-100",
                        expandedId !== template.id && "line-clamp-1"
                      )}>
                        {template.negativePrompt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className={cn(
                  "mt-3 text-xs",
                  isDarkMode ? "text-gray-500" : "text-gray-600"
                )}>
                  {language === 'zh' ? '更新于' : 'Updated'} {new Date(template.updatedAt || template.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {showEditModal && (
        <Dialog.Root open={showEditModal} onOpenChange={setShowEditModal}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <Dialog.Content className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto z-[101]",
              isDarkMode
                ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/30 shadow-cyan-500/20"
                : "bg-gradient-to-br from-white via-gray-50 to-white border-cyan-400/40 shadow-cyan-400/10"
            )}>
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-lime-400">
                    {editingId ? (language === 'zh' ? '编辑模板' : 'Edit Template') : (language === 'zh' ? '新建模板' : 'New Template')}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        isDarkMode
                          ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </Dialog.Close>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        {language === 'zh' ? '模板名称' : 'Template Name'}
                      </label>
                      <Input
                        placeholder={language === 'zh' ? '输入模板名称' : 'Enter template name'}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={cn(
                          isDarkMode
                            ? "bg-gray-800 border-gray-700 text-gray-100"
                            : "bg-white border-gray-300 text-gray-900"
                        )}
                      />
                    </div>

                    <div>
                      <label className={cn(
                        "block text-sm font-medium mb-2",
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      )}>
                        {language === 'zh' ? '分类' : 'Category'}
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className={cn(
                          "w-full px-4 py-2.5 backdrop-blur-sm border rounded-lg font-medium shadow-sm hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all duration-200 cursor-pointer appearance-none bg-no-repeat bg-right pr-10",
                          isDarkMode
                            ? "bg-gray-800/60 border-gray-600/50 text-gray-100"
                            : "bg-white border-gray-300 text-gray-900"
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath fill='${isDarkMode ? '%2394a3b8' : '%236b7280'}' d='M11.293 4.293L7 8.586 2.707 4.293A1 1 0 001.293 5.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.875rem center',
                          backgroundSize: '1.125rem'
                        }}
                      >
                        <option value="" className={cn(
                          "py-2",
                          isDarkMode ? "bg-gray-900 text-gray-400" : "bg-white text-gray-500"
                        )}>
                          {language === 'zh' ? '无分类' : 'No Category'}
                        </option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id} className={cn(
                            "py-2",
                            isDarkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
                          )}>
                            {getEmojiDisplay(cat.emoji)} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {language === 'zh' ? '描述' : 'Description'}
                    </label>
                    <Input
                      placeholder={language === 'zh' ? '简短描述（可选）' : 'Brief description (optional)'}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={cn(
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                  </div>

                  {/* Representative Image Upload */}
                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {language === 'zh' ? '代表图片' : 'Representative Image'}
                    </label>
                    <div className="space-y-3">
                      {formData.image && (
                        <div className="relative inline-block">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className={cn(
                              "w-full h-40 object-cover rounded-lg border-2",
                              isDarkMode ? "border-gray-700" : "border-gray-300"
                            )}
                          />
                          <button
                            onClick={() => {
                              setFormData({ ...formData, image: '' });
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-600/90 hover:bg-red-700 rounded-lg transition-colors"
                            type="button"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className={cn(
                            isDarkMode
                              ? "border-gray-700 text-gray-300 hover:bg-gray-800/50"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {formData.image 
                            ? (language === 'zh' ? '更换图片' : 'Change Image')
                            : (language === 'zh' ? '上传图片' : 'Upload Image')
                          }
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {language === 'zh' ? '正向提示词' : 'Positive Prompt'} *
                    </label>
                    <Textarea
                      placeholder={language === 'zh' ? '输入正向提示词...' : 'Enter positive prompt...'}
                      value={formData.positivePrompt}
                      onChange={(e) => setFormData({ ...formData, positivePrompt: e.target.value })}
                      rows={5}
                      className={cn(
                        "resize-none",
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn(
                      "block text-sm font-medium mb-2",
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    )}>
                      {language === 'zh' ? '负向提示词' : 'Negative Prompt'}
                    </label>
                    <Textarea
                      placeholder={language === 'zh' ? '输入负向提示词（可选）...' : 'Enter negative prompt (optional)...'}
                      value={formData.negativePrompt}
                      onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
                      rows={3}
                      className={cn(
                        "resize-none",
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-gray-100"
                          : "bg-white border-gray-300 text-gray-900"
                      )}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleSave}
                    disabled={!formData.name.trim() || !formData.positivePrompt.trim()}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {t.save}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="ghost"
                    className={cn(
                      "flex-1",
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
};
