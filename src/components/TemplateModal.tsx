import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import * as Dialog from '@radix-ui/react-dialog';
import { X, UploadCloud } from 'lucide-react';
import { cn } from '../utils/cn';

interface DisplayCategory {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  source: 'default' | 'custom';
}

interface TemplateFormData {
  name: string;
  positivePrompt: string;
  negativePrompt: string;
  description: string;
  emoji: string;
  categoryId: string;
  image: string;
}

interface TemplateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: any; // PromptTemplate | null
  formData: TemplateFormData;
  onFormDataChange: (data: TemplateFormData) => void;
  onSave: () => void;
  categories: DisplayCategory[];
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isDarkMode: boolean;
  language: string;
  t: any; // Translation object
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onOpenChange,
  editingTemplate,
  formData,
  onFormDataChange,
  onSave,
  categories,
  onImageUpload,
  fileInputRef,
  isDarkMode,
  language,
  t,
}) => {
  const insertPlaceholder = (field: 'positivePrompt' | 'negativePrompt') => {
    const cursorPos = document.querySelector<HTMLTextAreaElement>(`[data-field="${field}"]`)?.selectionStart || formData[field].length;
    const before = formData[field].substring(0, cursorPos);
    const after = formData[field].substring(cursorPos);
    onFormDataChange({ ...formData, [field]: before + '{prompt}' + after });
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg z-50 shadow-vis-glow-teal transition-colors flex flex-col bg-gray-900/95 border border-vis-border text-vis-text-primary backdrop-blur-sm"
          style={{
            width: '95vw',
            maxWidth: '768px',
            maxHeight: '90vh'
          }}
        >
          {/* Header - Sticky */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-vis-border">
            <Dialog.Title className="text-2xl font-semibold text-vis-text-primary">
              {editingTemplate ? t.editPromptTemplate : t.createPromptTemplate}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-vis-text-secondary hover:text-vis-teal-400 hover:bg-vis-teal-500/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Template Icon/Preview */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-vis-teal-500/20 to-vis-cyan-500/20 flex items-center justify-center border border-vis-teal-400/30">
                <span className="text-4xl font-bold text-vis-teal-400">
                  {formData.name.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1">
                <label className="block text-base font-medium text-vis-text-secondary mb-2">{t.name}</label>
                <Input
                  value={formData.name}
                  onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                  placeholder="Anime (Copy)"
                  className="w-full text-base py-3"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-base font-medium text-vis-text-secondary mb-2">
                {t.descriptionOptional}
              </label>
              <Input
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                placeholder={t.briefDescription}
                className="w-full text-base py-3"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-base font-medium text-vis-text-secondary mb-2">
                {t.templateCategoryLabel}
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => onFormDataChange({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-md px-4 py-3 text-base border border-vis-border bg-gray-800/50 text-vis-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-vis-teal-500/50 focus:border-vis-teal-400"
              >
                <option value="">{t.uncategorized}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji ? `${category.emoji} ` : ''}{category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-base font-medium text-vis-text-secondary mb-2">
                {t.templateImageLabel || 'Template Image'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border-vis-border bg-gray-800/50 text-vis-text-secondary hover:text-vis-text-primary hover:bg-vis-teal-500/10 hover:border-vis-teal-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="h-5 w-5" />
                <span>{t.templateImageUpload || 'Upload Image'}</span>
              </Button>
              {formData.image && (
                <div className="mt-3 flex items-center gap-4">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="h-24 w-24 rounded-md object-cover border border-vis-border transition-colors"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    type="button"
                    onClick={() => onFormDataChange({ ...formData, image: '' })}
                  >
                    {t.templateImageClear || 'Clear'}
                  </Button>
                </div>
              )}
            </div>

            {/* Positive Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-base font-medium text-vis-text-secondary">
                  {t.positivePrompt}
                </label>
                <button
                  onClick={() => insertPlaceholder('positivePrompt')}
                  className="text-sm text-vis-cyan-400 hover:text-vis-cyan-300 transition-colors"
                >
                  {t.insertPlaceholder}
                </button>
              </div>
              <Textarea
                value={formData.positivePrompt}
                onChange={(e) => onFormDataChange({ ...formData, positivePrompt: e.target.value })}
                placeholder="{prompt} anime++, bold outline, cel-shaded coloring, shounen, seinen"
                className="w-full min-h-[120px] text-base bg-gray-800/50 border-vis-border text-vis-text-primary focus-visible:ring-2 focus-visible:ring-vis-teal-500/50 focus-visible:border-vis-teal-400 transition-colors"
                data-field="positivePrompt"
              />
              <p className="text-sm mt-2 text-vis-text-muted">
                {t.usePlaceholder.replace('{prompt}', '')}
                <code className="px-2 py-1 rounded text-sm bg-gray-800 text-vis-text-primary border border-vis-border">
                  {'{prompt}'}
                </code>
                {t.usePlaceholder.split('{prompt}')[1]}
              </p>
            </div>

            {/* Negative Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-base font-medium text-vis-text-secondary">
                  {t.negativePrompt}
                </label>
                <button
                  onClick={() => insertPlaceholder('negativePrompt')}
                  className="text-sm text-vis-cyan-400 hover:text-vis-cyan-300 transition-colors"
                >
                  {t.insertPlaceholder}
                </button>
              </div>
              <Textarea
                value={formData.negativePrompt}
                onChange={(e) => onFormDataChange({ ...formData, negativePrompt: e.target.value })}
                placeholder="{photo}+++, greyscale, solid black, painting"
                className="w-full min-h-[120px] text-base bg-gray-800/50 border-vis-border text-vis-text-primary focus-visible:ring-2 focus-visible:ring-vis-teal-500/50 focus-visible:border-vis-teal-400 transition-colors"
                data-field="negativePrompt"
              />
            </div>

            {/* Info Text */}
            <div className="text-sm space-y-2 rounded-lg p-4 bg-vis-teal-500/10 border border-vis-teal-400/30 text-vis-text-secondary transition-colors">
              <p>{t.templateExplanation}</p>
              <p>
                {t.templateOmitPlaceholder}
              </p>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-vis-border bg-gray-900/95">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="px-6 py-3 text-base text-vis-text-secondary hover:text-vis-text-primary hover:bg-gray-800/50 transition-colors"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={onSave}
              className="px-6 py-3 text-base bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 hover:from-vis-teal-400 hover:to-vis-cyan-400 text-white shadow-vis-glow-teal hover:shadow-vis-glow-cyan transition-all duration-200"
            >
              {t.save}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};