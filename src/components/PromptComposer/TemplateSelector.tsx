import React from 'react';
import { Eye, Layers, X, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { PromptTemplate } from '../TemplatesView';

interface TemplateSelectorProps {
  selectedTemplate: string | null;
  currentTemplate: PromptTemplate | null;
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
  // Get template display info - prefer lastSelectedTemplate, fall back to currentTemplate
  const templateInfo = React.useMemo(() => {
    if (lastSelectedTemplate) return lastSelectedTemplate;
    if (currentTemplate) {
      return {
        name: currentTemplate.name,
        image: currentTemplate.image,
        emoji: currentTemplate.emoji,
      };
    }
    return null;
  }, [lastSelectedTemplate, currentTemplate]);

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
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Show icon/emoji/image when template is selected */}
          {templateInfo && (
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-gray-700/50">
              {templateInfo.image ? (
                <img
                  src={templateInfo.image}
                  alt={templateInfo.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    console.log('Image failed to load:', templateInfo.image);
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const emoji = templateInfo.emoji;
                      const name = templateInfo.name || '';
                      target.parentElement.innerHTML = emoji 
                        ? `<span class="text-lg">${emoji}</span>`
                        : `<span class="text-xs font-semibold text-purple-400">${name.charAt(0).toUpperCase()}</span>`;
                    }
                  }}
                />
              ) : templateInfo.emoji ? (
                <span className="text-lg leading-none">{templateInfo.emoji}</span>
              ) : (
                <span className="text-xs font-semibold text-purple-400">
                  {(templateInfo.name || 'T').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}
          <span className="text-sm font-medium text-gray-100 truncate">
            {templateInfo?.name || t.choosePromptTemplate}
          </span>
        </div>

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
