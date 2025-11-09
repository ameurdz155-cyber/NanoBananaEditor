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
      ? 'text-vis-teal-100'
      : 'text-vis-text-muted'
  );

  return (
    <button
      onClick={() => onClick(category)}
      className={cn(
        'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-all duration-200',
        isActive
          ? 'border-vis-teal-400 bg-gradient-to-r from-vis-teal-500/10 to-vis-cyan-500/10 text-vis-teal-200 shadow-vis-glow-teal'
          : 'border-vis-border text-vis-text-secondary hover:text-vis-text-primary hover:border-vis-teal-400/50 hover:bg-vis-teal-500/5'
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