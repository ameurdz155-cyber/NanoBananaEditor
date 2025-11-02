import React from 'react';
import { Eye, Layers, X, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Template {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
  positivePrompt: string;
  negativePrompt?: string;
}

interface TemplateSelectorProps {
  selectedTemplate: string | null;
  currentTemplate: Template | null;
  lastSelectedTemplate: { name: string; image?: string; emoji?: string } | null;
  isTemplatePromptActive: boolean;
  savedPromptBeforeTemplate: string;
  currentPrompt: string;
  onShowTemplatesModal: () => void;
  onViewTemplate: () => void;
  onFlattenTemplate: (positivePrompt: string, negativePrompt: string, shouldShowNegative: boolean) => void;
  onClearTemplate: () => void;
  t: any;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  currentTemplate,
  lastSelectedTemplate,
  isTemplatePromptActive,
  savedPromptBeforeTemplate,
  currentPrompt,
  onShowTemplatesModal,
  onViewTemplate,
  onFlattenTemplate,
  onClearTemplate,
  t,
}) => {
  const handleFlatten = () => {
    if (!currentTemplate) return;

    const basePrompt = isTemplatePromptActive ? savedPromptBeforeTemplate : currentPrompt;

    const positiveWithPrompt = currentTemplate.positivePrompt.includes('{prompt}')
      ? currentTemplate.positivePrompt.replace('{prompt}', basePrompt || '')
      : [basePrompt, currentTemplate.positivePrompt].filter(Boolean).join(basePrompt ? '\n\n' : '');

    const cleanedPositive = positiveWithPrompt.replace('{photo}', '').trim();

    let cleanedNegative = '';
    let shouldShowNegative = false;

    if (currentTemplate.negativePrompt?.trim()) {
      const negativeSource = currentTemplate.negativePrompt.includes('{prompt}')
        ? currentTemplate.negativePrompt.replace('{prompt}', basePrompt || '')
        : currentTemplate.negativePrompt;

      cleanedNegative = negativeSource.replace('{photo}', '').trim();
      shouldShowNegative = !!cleanedNegative;
    }

    onFlattenTemplate(cleanedPositive, cleanedNegative, shouldShowNegative);
  };

  return (
    <div
      className="rounded-lg border border-gray-800/60 bg-gray-950/90 cursor-pointer transition-colors hover:border-gray-700/80 hover:bg-gray-900/80"
      role="button"
      tabIndex={0}
      onClick={onShowTemplatesModal}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onShowTemplatesModal();
        }
      }}
    >
      <div className="flex w-full items-center justify-between px-3 py-2.5">
        <span className="text-sm font-medium text-gray-100 truncate">
          {lastSelectedTemplate?.name || t.choosePromptTemplate}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selectedTemplate && (
            <>
              {/* View Icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTemplate();
                }}
                className={cn(
                  'h-7 w-7 flex items-center justify-center rounded-full transition-colors',
                  isTemplatePromptActive
                    ? 'text-purple-400 bg-purple-500/10 hover:text-purple-300'
                    : 'text-gray-400 hover:text-purple-300'
                )}
                title={isTemplatePromptActive ? t.hideTemplatePromptButton : t.viewTemplatePrompt}
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* Flatten Icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlatten();
                }}
                className="h-7 w-7 flex items-center justify-center rounded-full text-gray-400 hover:text-purple-300 transition-colors"
                title={t.flattenTemplateButton}
              >
                <Layers className="h-4 w-4" />
              </button>

              {/* Clear Icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearTemplate();
                }}
                className="h-7 w-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-400 transition-colors"
                title={t.clearTemplateButton}
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Dropdown Toggle */}
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-transform'
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
