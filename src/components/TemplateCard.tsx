import React from 'react';
import { Button } from './ui/Button';
import { Copy, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { PromptTemplate } from '../types';

interface TemplateCardProps {
  template: PromptTemplate;
  isCustom: boolean;
  isSelected: boolean;
  isDarkMode: boolean;
  language: string;
  categoryLookup: Map<string, { id: string; name: string; emoji?: string; image?: string }>;
  onSelect: (template: PromptTemplate) => void;
  onDuplicate: (template: PromptTemplate) => void;
  onEdit: (template: PromptTemplate) => void;
  onDelete: (templateId: string) => void;
  renderIconValue: (value?: string, className?: string) => React.ReactNode;
  t: any; // Translation object
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isCustom,
  isSelected,
  isDarkMode,
  language,
  categoryLookup,
  onSelect,
  onDuplicate,
  onEdit,
  onDelete,
  renderIconValue,
  t,
}) => {
  const categoryInfo = template.categoryId ? categoryLookup.get(template.categoryId) : undefined;

  const cardClasses = cn(
    'group relative w-full cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 backdrop-blur h-full',
    isSelected
      ? 'border-vis-teal-400 bg-gray-800/50 shadow-vis-glow-teal'
      : 'border-vis-border bg-gray-800/30 hover:border-vis-teal-400/40 hover:shadow-vis-glow-teal/50 hover:-translate-y-0.5'
  );

  const cardStyle: React.CSSProperties = {};

  const contentClasses = 'cursor-pointer flex h-full flex-col gap-4 p-4';

  const thumbnailClasses = 'relative overflow-hidden rounded-lg border border-vis-border bg-gradient-to-br from-vis-teal-500/20 via-vis-cyan-500/15 to-vis-teal-500/25 flex items-center justify-center w-full h-32';

  const thumbnailStyle = {};

  const rawImage = template.image?.trim();
  const imageSrc = rawImage && (/^https?:\/\//i.test(rawImage) || /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(rawImage)) ? rawImage : undefined;

  const templateIconNode = !imageSrc
    ? renderIconValue(
        template.emoji,
        'w-12 h-12 text-3xl leading-none flex items-center justify-center text-vis-teal-400'
      )
    : null;

  const categoryIconNode = renderIconValue(
    categoryInfo?.emoji,
    'w-4 h-4 text-xs flex items-center justify-center text-vis-teal-400'
  );

  const activeActionsClasses = 'flex w-full items-center justify-end gap-2 pt-2';

  const hoverActionsClasses = 'flex w-full items-center justify-end gap-2 pt-2 opacity-0 transition-opacity group-hover:opacity-100';

  return (
    <div className={cardClasses} style={cardStyle}>
      <div
        className={contentClasses}
        onClick={() => onSelect(template)}
      >
        <div className={thumbnailClasses} style={thumbnailStyle}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={template.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            templateIconNode || (
              <span className="text-2xl font-semibold text-vis-teal-400">
                {template.name.charAt(0).toUpperCase()}
              </span>
            )
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-vis-text-primary">{template.name}</h4>
            {isSelected && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border border-vis-teal-400/40 bg-vis-teal-500/20 text-vis-teal-200">
                {language === 'zh' ? '已应用' : 'Active'}
              </span>
            )}
          </div>

          {template.description && (
            <p className="text-xs line-clamp-3 text-vis-text-secondary">
              {template.description}
            </p>
          )}

          {categoryInfo ? (
            <div className="flex items-center gap-1 text-[11px] text-vis-text-muted">
              {categoryIconNode}
              <span>{categoryInfo.name}</span>
            </div>
          ) : !template.categoryId ? (
            <div className="text-[11px] text-vis-text-muted">{t.uncategorized}</div>
          ) : null}
        </div>

        {isSelected ? (
          <div className={activeActionsClasses}>
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-vis-text-muted">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <div className={hoverActionsClasses}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-vis-text-secondary hover:text-vis-cyan-400 hover:bg-vis-cyan-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(template);
              }}
              title={t.duplicateTemplate}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            {isCustom && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-vis-text-secondary hover:text-vis-teal-400 hover:bg-vis-teal-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(template);
                  }}
                  title={t.editTemplate}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-400 hover:text-red-200 hover:bg-red-500/15"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(template.id);
                  }}
                  title={t.deleteTemplate}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};