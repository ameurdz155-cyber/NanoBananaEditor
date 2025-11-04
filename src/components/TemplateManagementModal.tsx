import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { X, Plus, Edit2, Trash2, Save, FileText, Eye, EyeOff, Copy, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { cn } from '../utils/cn';
import { getDefaultTemplates } from './TemplatesView';
import type { PromptTemplate } from '../types';

interface TemplateManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TemplateManagementModal: React.FC<TemplateManagementModalProps> = ({ open, onOpenChange }) => {
  const language = useAppStore((state) => state.language);
  const t = getTranslation(language);
  
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; emoji: string }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    positivePrompt: '',
    negativePrompt: '',
    categoryId: '',
    emoji: '✨',
  });

  // Load templates and categories
  useEffect(() => {
    if (open) {
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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-5xl h-[90vh] overflow-hidden z-[100] rounded-2xl border shadow-2xl",
            "text-[var(--text-primary)]"
          )}
          style={{
            background: 'var(--modal-surface-background)',
            borderColor: 'var(--modal-surface-border)'
          }}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--surface-border-light)] bg-[var(--surface-secondary)]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-600/20 rounded-lg">
                <FileText className="h-5 w-5 text-cyan-400" />
              </div>
                      <div
                        key={tpl.id}
                        className="p-4 rounded-lg border transition-all hover:bg-[var(--bg-hover)]"
                        style={{
                          background: 'var(--surface-secondary)',
                          borderColor: 'var(--surface-border)'
                        }}
                      >
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.clickToManageTemplates}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={t.searchPrompts}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
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
                    "transition-all",
                    selectedCategoryFilter === 'all'
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-gray-400 hover:text-gray-200"
                  )}
                >
                  {t.allCategories}
                </Button>
                <Button
                  onClick={() => setSelectedCategoryFilter('uncategorized')}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "transition-all",
                    selectedCategoryFilter === 'uncategorized'
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-gray-400 hover:text-gray-200"
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
                      "transition-all",
                      selectedCategoryFilter === cat.id
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "text-gray-400 hover:text-gray-200"
                    )}
                  >
                    {getEmojiDisplay(cat.emoji)} {cat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="px-6 py-4 bg-cyan-500/5 border-b border-cyan-500/20 max-h-[50vh] overflow-y-auto">
                <h3 className="text-sm font-semibold text-cyan-300 mb-4">
                  {editingId ? t.editPromptTemplate : t.createPromptTemplate}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <div className="w-20">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t.templateEmojiLabel}
                      </label>
                      <Input
                        value={formData.emoji}
                        onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                        className="text-center text-2xl"
                        maxLength={2}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t.name} *
                      </label>
                      <Input
                        placeholder="e.g., Cinematic Portrait"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t.description}
                      </label>
                      <Input
                        placeholder={t.briefDescription}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t.templateCategoryLabel}
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{
                          background: 'var(--surface-secondary)',
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.positivePrompt} *
                    </label>
                    <Textarea
                      placeholder="cinematic portrait, professional lighting, {prompt}"
                      value={formData.positivePrompt}
                      onChange={(e) => setFormData({ ...formData, positivePrompt: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t.usePlaceholder}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t.negativePrompt}
                    </label>
                    <Textarea
                      placeholder="blurry, low quality, distorted"
                      value={formData.negativePrompt}
                      onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
                      rows={2}
                      className="resize-none"
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
                      className="text-gray-400 hover:text-gray-200"
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
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">
                    {searchQuery ? t.noPromptsFound : 'No templates yet'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? t.tryDifferentSearch : 'Create your first template to get started'}
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
                          <span className="text-2xl">{template.emoji || '✨'}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-gray-200 font-medium">{template.name}</h4>
                            {template.description && (
                              <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
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
                            className="text-gray-400 hover:text-gray-200"
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
                        <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-green-400 mb-1">{t.positive}</p>
                            <p className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded">{template.positivePrompt}</p>
                          </div>
                          {template.negativePrompt && (
                            <div>
                              <p className="text-xs font-medium text-red-400 mb-1">{t.negative}</p>
                              <p className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded">{template.negativePrompt}</p>
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
                <p className="text-sm text-gray-400">
                  {filteredTemplates.length} {t.templates.toLowerCase()}
                </p>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  className="text-gray-300 hover:text-gray-100"
                >
                  {t.ok}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
