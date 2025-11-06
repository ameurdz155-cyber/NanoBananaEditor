import React from 'react';
import { cn } from '../utils/cn';

interface DisplayCategory {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  source: 'default' | 'custom';
  count?: number;
}

interface CategoryChipProps {
  category: DisplayCategory;
  isActive: boolean;
  isDarkMode: boolean;
  onClick: (category: DisplayCategory) => void;
  renderIconValue: (value?: string, className?: string) => React.ReactNode;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  isActive,
  isDarkMode,
  onClick,
  renderIconValue,
}) => {
  const countValue = category.count ?? 0;
  const countClasses = cn(
    'ml-1 text-[11px] font-medium transition-colors',
    isActive
      ? isDarkMode
        ? 'text-purple-100'
        : 'text-purple-700'
      : isDarkMode
        ? 'text-[color:var(--text-tertiary)]'
        : 'text-slate-500'
  );

  return (
    <button
      onClick={() => onClick(category)}
      className={cn(
        'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-all',
        isActive
          ? isDarkMode
            ? 'border-purple-500 bg-purple-500/10 text-purple-200 shadow-sm'
            : 'border-purple-300 bg-purple-100 text-purple-700 shadow-sm'
          : isDarkMode
            ? 'border-[color:var(--surface-border)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-purple-400/40 hover:bg-purple-500/5'
            : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-purple-300/60 hover:bg-purple-50'
      )}
      type="button"
    >
      {renderIconValue(category.emoji, 'w-4 h-4 text-sm leading-none flex items-center justify-center')}
      <span className="inline-flex items-center gap-1">
        <span>{category.name}</span>
        <span className={countClasses}>({countValue})</span>
      </span>
    </button>
  );
};