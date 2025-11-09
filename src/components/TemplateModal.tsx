import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Dialog } from '@radix-ui/react-dialog';
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
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg z-50 shadow-2xl transition-colors flex flex-col"
          style={{
            width: '95vw',
            maxWidth: '768px',
            maxHeight: '90vh',
            background: 'var(--modal-surface-background)',
            border: '1px solid var(--modal-surface-border)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Header - Sticky */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-[color:var(--surface-border)]">
            <Dialog.Title className="text-2xl font-semibold text-[color:var(--text-primary)]">
              {editingTemplate ? t.editPromptTemplate : t.createPromptTemplate}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 transition-colors',
                  isDarkMode
                    ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                    : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5'
                )}
              >
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Template Icon/Preview */}
            <div className="flex items-center gap-6">
              <div
                className={cn(
                  'w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border',
                  isDarkMode ? 'border-gray-800' : 'border-purple-200/60'
                )}
              >
                <span className={cn('text-4xl font-bold', isDarkMode ? 'text-purple-400' : 'text-purple-600')}>
                  {formData.name.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1">
                <label className="block text-base font-medium text-[color:var(--text-secondary)] mb-2">{t.name}</label>
                <Input
                  value={formData.name}
                  onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                  placeholder="Anime (Copy)"
                  className={cn(
                    'w-full text-base py-3',
                    !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white focus-visible:shadow-[0_0_18px_rgba(168,85,247,0.12)]'
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-base font-medium text-[color:var(--text-secondary)] mb-2">
                {t.descriptionOptional}
              </label>
              <Input
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                placeholder={t.briefDescription}
                className={cn(
                  'w-full text-base py-3',
                  !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white'
                )}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-base font-medium text-[color:var(--text-secondary)] mb-2">
                {t.templateCategoryLabel}
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => onFormDataChange({ ...formData, categoryId: e.target.value })}
                className={cn(
                  'w-full rounded-md px-4 py-3 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500',
                  isDarkMode
                    ? 'bg-[color:var(--surface-primary)] border-[color:var(--surface-border)] text-[color:var(--text-primary)]'
                    : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                )}
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
              <label className="block text-base font-medium text-[color:var(--text-secondary)] mb-2">
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
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 px-4 transition-colors',
                  isDarkMode
                    ? 'border-[color:var(--surface-border)] bg-[color:var(--surface-secondary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                )}
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
                    className={cn(
                      'h-24 w-24 rounded-md object-cover transition-colors',
                      isDarkMode ? 'border border-gray-800' : 'border border-purple-200/70'
                    )}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-sm transition-colors',
                      isDarkMode
                        ? 'text-[color:var(--text-tertiary)] hover:text-red-300'
                        : 'text-slate-500 hover:text-red-500'
                    )}
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
                <label className="block text-base font-medium text-[color:var(--text-secondary)]">
                  {t.positivePrompt}
                </label>
                <button
                  onClick={() => insertPlaceholder('positivePrompt')}
                  className={cn(
                    'text-sm transition-colors',
                    isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'
                  )}
                >
                  {t.insertPlaceholder}
                </button>
              </div>
              <Textarea
                value={formData.positivePrompt}
                onChange={(e) => onFormDataChange({ ...formData, positivePrompt: e.target.value })}
                placeholder="{prompt} anime++, bold outline, cel-shaded coloring, shounen, seinen"
                className={cn(
                  'w-full min-h-[120px] text-base transition-colors',
                  isDarkMode
                    ? 'bg-[color:var(--surface-primary)] border-[color:var(--surface-border)] text-[color:var(--text-primary)] focus-visible:ring-1 focus-visible:ring-purple-500/70'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-purple-400'
                )}
                data-field="positivePrompt"
              />
              <p className={cn('text-sm mt-2', isDarkMode ? 'text-[color:var(--text-tertiary)]' : 'text-slate-600')}>
                {t.usePlaceholder.replace('{prompt}', '')}
                <code
                  className={cn(
                    'px-2 py-1 rounded text-sm',
                    isDarkMode ? 'bg-gray-800 text-[color:var(--text-primary)]' : 'bg-slate-200 text-slate-900'
                  )}
                >
                  {'{prompt}'}
                </code>
                {t.usePlaceholder.split('{prompt}')[1]}
              </p>
            </div>

            {/* Negative Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-base font-medium text-[color:var(--text-secondary)]">
                  {t.negativePrompt}
                </label>
                <button
                  onClick={() => insertPlaceholder('negativePrompt')}
                  className={cn(
                    'text-sm transition-colors',
                    isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'
                  )}
                >
                  {t.insertPlaceholder}
                </button>
              </div>
              <Textarea
                value={formData.negativePrompt}
                onChange={(e) => onFormDataChange({ ...formData, negativePrompt: e.target.value })}
                placeholder="{photo}+++, greyscale, solid black, painting"
                className={cn(
                  'w-full min-h-[120px] text-base transition-colors',
                  isDarkMode
                    ? 'bg-[color:var(--surface-primary)] border-[color:var(--surface-border)] text-[color:var(--text-primary)] focus-visible:ring-1 focus-visible:ring-purple-500/70'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-purple-400'
                )}
                data-field="negativePrompt"
              />
            </div>

            {/* Info Text */}
            <div
              className={cn(
                'text-sm space-y-2 rounded-lg p-4 transition-colors',
                isDarkMode
                  ? 'bg-black/40 border border-gray-800 text-[color:var(--text-secondary)]'
                  : 'bg-purple-50/70 border border-purple-200 text-slate-700'
              )}
            >
              <p>{t.templateExplanation}</p>
              <p>
                {t.templateOmitPlaceholder}
              </p>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-[color:var(--surface-border)] bg-[var(--modal-surface-background)]">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className={cn(
                'px-6 py-3 text-base transition-colors',
                isDarkMode
                  ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
              )}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={onSave}
              className={cn(
                'px-6 py-3 text-base transition-colors',
                isDarkMode
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_12px_30px_-12px_rgba(168,85,247,0.45)]'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_14px_34px_-18px_rgba(168,85,247,0.55)]'
              )}
            >
              {t.save}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};