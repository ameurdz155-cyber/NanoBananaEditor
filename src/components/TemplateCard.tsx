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
    'group relative w-full cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 backdrop-blur hover:border-purple-500/40 h-full',
    isSelected
      ? 'shadow-[0_15px_35px_-18px_rgba(168,85,247,0.45)]'
      : 'hover:shadow-[0_18px_36px_-20px_rgba(168,85,247,0.35)] hover:-translate-y-0.5'
  );

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface-secondary)',
    borderColor: isSelected ? 'rgba(168, 85, 247, 0.4)' : 'var(--surface-border)'
  };

  const contentClasses = 'cursor-pointer flex h-full flex-col gap-4 p-4';

  const thumbnailClasses = 'relative overflow-hidden rounded-lg border bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-purple-500/25 flex items-center justify-center w-full h-32';

  const thumbnailStyle = {
    borderColor: 'var(--surface-border)'
  };

  const templateIconNode = !template.image
    ? renderIconValue(
        template.emoji,
        cn(
          'w-12 h-12 text-3xl leading-none flex items-center justify-center',
          isDarkMode ? 'text-purple-200' : 'text-purple-600'
        )
      )
    : null;

  const categoryIconNode = renderIconValue(
    categoryInfo?.emoji,
    cn(
      'w-4 h-4 text-xs flex items-center justify-center',
      isDarkMode ? 'text-purple-200' : 'text-purple-500'
    )
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
          {template.image ? (
            <img
              src={template.image}
              alt={template.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            templateIconNode || (
              <span
                className={cn(
                  'text-2xl font-semibold',
                  isDarkMode ? 'text-purple-200' : 'text-purple-600'
                )}
              >
                {template.name.charAt(0).toUpperCase()}
              </span>
            )
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{template.name}</h4>
            {isSelected && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border',
                  isDarkMode
                    ? 'border-purple-500/40 bg-purple-500/15 text-purple-200'
                    : 'border-purple-300 bg-purple-100 text-purple-700'
                )}
              >
                {language === 'zh' ? '已应用' : 'Active'}
              </span>
            )}
          </div>

          {template.description && (
            <p
              className="text-xs line-clamp-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              {template.description}
            </p>
          )}

          {categoryInfo ? (
            <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              {categoryIconNode}
              <span>{categoryInfo.name}</span>
            </div>
          ) : !template.categoryId ? (
            <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{t.uncategorized}</div>
          ) : null}
        </div>

        {isSelected ? (
          <div className={activeActionsClasses}>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <div className={hoverActionsClasses}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-secondary)' }}
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
                  className="h-8 w-8 hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
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