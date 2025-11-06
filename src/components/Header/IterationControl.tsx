import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

interface IterationControlProps {
  isGenerating: boolean;
  isValidating: boolean;
  iterations: number;
  generationProgress: { current: number; total: number };
  iterationsLabel: string;
  stopGeneration: string;
  validating: string;
  generate: string;
  isDarkMode: boolean;
  onIterationsChange: (value: number) => void;
  onPrimaryAction: () => void;
}

export const IterationControl: React.FC<IterationControlProps> = ({
  isGenerating,
  isValidating,
  iterations,
  generationProgress,
  iterationsLabel,
  stopGeneration,
  validating,
  generate,
  isDarkMode,
  onIterationsChange,
  onPrimaryAction,
}) => {
  const primaryButtonVariant = isGenerating || isValidating ? 'default' : 'ghost';

  const primaryButtonClassName = cn(
    'h-9 px-4 rounded-none border-0 transition-colors',
    isGenerating
      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
      : isValidating
        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600 hover:to-blue-600 text-white'
        : 'hover:bg-gray-800/80 text-gray-100'
  );

  const iterationControlWrapperClasses = cn(
    'flex items-center space-x-0 rounded-lg overflow-hidden transition-colors group backdrop-blur-md',
    isDarkMode
      ? 'bg-gray-900/90 border border-gray-700/60 hover:border-purple-500/50'
      : 'bg-white/80 border border-purple-200/60 hover:border-purple-300/70 shadow-sm'
  );

  const iterationInputClasses = cn(
    'w-12 h-9 px-2 border-0 border-r text-center text-sm font-medium focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:shadow-none transition-colors peer rounded-none',
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-750 focus-visible:border-gray-700'
      : 'bg-white/60 border-purple-200/70 text-gray-700 hover:bg-white focus:border-purple-300 focus-visible:border-purple-300'
  );

  const tooltipClasses = cn(
    'absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 pointer-events-none peer-hover:opacity-100 transition-opacity duration-200 shadow-lg',
    isDarkMode
      ? 'bg-gray-800 border border-purple-500/40 text-gray-200'
      : 'bg-white border border-purple-200/80 text-gray-600 backdrop-blur'
  );

  const tooltipArrowClasses = cn(
    'absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent',
    isDarkMode ? 'border-t-purple-500/40' : 'border-t-purple-200/70'
  );

  return (
    <div className={iterationControlWrapperClasses}>
      <div className="relative">
        <Input
          key="iterations-input"
          type="number"
          min={1}
          max={10}
          value={iterations}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 1;
            onIterationsChange(Math.max(1, Math.min(10, value)));
          }}
          disabled={isGenerating || isValidating}
          aria-label={iterationsLabel}
          className={iterationInputClasses}
        />
        <div className={tooltipClasses}>
          <span className="font-semibold text-purple-400">{iterationsLabel}</span>
          <span className="text-gray-400 mx-1">·</span>
          <span>{`${iterations} ${iterations === 1 ? 'image' : 'images'}`}</span>
          <div className={tooltipArrowClasses} />
        </div>
      </div>
      <Button
        variant={primaryButtonVariant}
        size="sm"
        onClick={onPrimaryAction}
        className={primaryButtonClassName}
        aria-pressed={isGenerating || isValidating}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            {generationProgress.total > 0 ? (
              <span className="whitespace-nowrap">
                {stopGeneration} ({generationProgress.current}/{generationProgress.total})
              </span>
            ) : (
              <span>{stopGeneration}</span>
            )}
          </>
        ) : isValidating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            <span>{validating}</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            <span>{generate}</span>
          </>
        )}
      </Button>
    </div>
  );
};
