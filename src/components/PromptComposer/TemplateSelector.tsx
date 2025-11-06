import React from 'react';
import { Eye, Layers, X, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { PromptTemplate } from '../TemplatesView';

interface TemplateSelectorProps {
  selectedTemplate: string | null;
  currentTemplate: PromptTemplate | null;
  lastSelectedTemplate: {
    id: string;
    name: string;
    image?: string;
    emoji?: string;
    positivePrompt: string;
    negativePrompt?: string;
  } | null;
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
  const resolvedTemplate = React.useMemo(() => currentTemplate ?? lastSelectedTemplate ?? null, [currentTemplate, lastSelectedTemplate]);

  const templateInfo = React.useMemo(() => {
    if (!resolvedTemplate) {
      return null;
    }
    return {
      name: resolvedTemplate.name,
      image: resolvedTemplate.image,
      emoji: resolvedTemplate.emoji,
    };
  }, [resolvedTemplate]);

  const hasActiveTemplate = Boolean(selectedTemplate && resolvedTemplate);
  const hasMissingTemplate = Boolean(selectedTemplate && !currentTemplate && !lastSelectedTemplate);

  const handleFlatten = () => {
    if (!resolvedTemplate) {
      return;
    }

    const basePrompt = isTemplatePromptActive ? savedPromptBeforeTemplate : currentPrompt;

    const positiveSource = resolvedTemplate.positivePrompt ?? '';
    const positiveWithPrompt = positiveSource.includes('{prompt}')
      ? positiveSource.replace('{prompt}', basePrompt || '')
      : [basePrompt, positiveSource].filter(Boolean).join(basePrompt ? '\n\n' : '');

    const cleanedPositive = positiveWithPrompt.replace('{photo}', '').trim();

    const negativeSourceRaw = resolvedTemplate.negativePrompt ?? '';
    const negativeWithPrompt = negativeSourceRaw.includes('{prompt}')
      ? negativeSourceRaw.replace('{prompt}', basePrompt || '')
      : negativeSourceRaw;

    const cleanedNegative = negativeWithPrompt.replace('{photo}', '').trim();
    const shouldShowNegative = cleanedNegative.length > 0;

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
            {templateInfo?.name || (hasMissingTemplate ? t.noPromptTemplatesAvailable ?? 'Template unavailable' : t.choosePromptTemplate)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasActiveTemplate && (
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

          {hasMissingTemplate && (
            <span className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-200 border border-amber-400/30">
              {t.noPromptTemplatesAvailable ?? 'Template unavailable'}
            </span>
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
