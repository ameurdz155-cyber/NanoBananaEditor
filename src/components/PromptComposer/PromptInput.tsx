import React from 'react';
import { History, Plus, Minus, X, Trash2 } from 'lucide-react';
import { Textarea } from '../ui/Textarea';
import { cn } from '../../utils/cn';

interface PromptInputProps {
  currentPrompt: string;
  negativePrompt: string;
  showNegativePrompt: boolean;
  showPromptHistory: boolean;
  historySearchQuery: string;
  promptHistory: string[];
  filteredPromptHistory: string[];
  historyButtonRef: React.RefObject<HTMLButtonElement>;
  historyPopoverRef: React.RefObject<HTMLDivElement>;
  historySearchInputRef: React.RefObject<HTMLInputElement>;
  onPromptChange: (value: string) => void;
  onNegativePromptChange: (value: string) => void;
  onToggleNegativePrompt: () => void;
  onToggleHistory: () => void;
  onHistorySearchChange: (value: string) => void;
  onSelectHistoryPrompt: (prompt: string) => void;
  onClearHistory: () => void;
  selectedTool: 'generate' | 'edit' | 'mask';
  t: any;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  currentPrompt,
  negativePrompt,
  showNegativePrompt,
  showPromptHistory,
  historySearchQuery,
  promptHistory,
  filteredPromptHistory,
  historyButtonRef,
  historyPopoverRef,
  historySearchInputRef,
  onPromptChange,
  onNegativePromptChange,
  onToggleNegativePrompt,
  onToggleHistory,
  onHistorySearchChange,
  onSelectHistoryPrompt,
  onClearHistory,
  selectedTool,
  t,
}) => {
  return (
    <div className="bg-[#1a1c24] rounded-xl p-4 border border-gray-800/80 hover:border-gray-700 transition-all flex-shrink-0 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-200 flex items-center">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mr-2"></span>
          {selectedTool === 'generate' ? t.generateFromText : t.editInstructions}
        </label>
      </div>

      <p className="text-xs text-gray-400/90 mb-3">
        {selectedTool === 'generate' ? t.enterPromptAndInvoke : t.describeChanges}
      </p>

      {/* Textarea with History Button */}
      <div className="relative">
        <Textarea
          value={currentPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={
            selectedTool === 'generate' ? t.promptPlaceholderGenerate : t.promptPlaceholderEdit
          }
          className="min-h-[140px] resize-none bg-[#11131b] border border-gray-800/70 focus:border-purple-400/70 focus:ring-0 transition-colors pr-20 text-[13px] leading-relaxed"
        />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={onToggleHistory}
            ref={historyButtonRef}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-md text-gray-400 transition-all duration-200',
              showPromptHistory
                ? 'bg-red-500/15 text-red-200 shadow-[0_0_12px_rgba(248,113,113,0.35)]'
                : 'hover:text-gray-100 hover:bg-[#2a2c35]'
            )}
            title={t.promptHistory}
          >
            <span className="sr-only">{t.promptHistory}</span>
            <History className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleNegativePrompt}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-md text-gray-400 transition-all duration-200',
              showNegativePrompt
                ? 'bg-orange-500/15 text-orange-200 shadow-[0_0_12px_rgba(251,146,60,0.35)]'
                : 'hover:text-gray-100 hover:bg-[#2a2c35]'
            )}
            title={showNegativePrompt ? t.hideNegativePrompt : t.addNegativePrompt}
            aria-label={showNegativePrompt ? t.hideNegativePrompt : t.addNegativePrompt}
          >
            {showNegativePrompt ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            <span className="sr-only">{t.negativePromptLabel}</span>
          </button>
        </div>
        {showPromptHistory && (
          <div
            ref={historyPopoverRef}
            className="absolute top-14 right-0 w-72 rounded-xl border border-gray-800 bg-[#1b1d26] shadow-[0_20px_45px_-24px_rgba(0,0,0,0.85)] p-4 z-50"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-200">{t.promptHistory}</p>
              <button
                type="button"
                onClick={onToggleHistory}
                className="h-6 w-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-200 hover:bg-[#2a2c35]"
              >
                <span className="sr-only">Close history</span>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <div className="relative">
                <input
                  ref={historySearchInputRef}
                  type="text"
                  placeholder={t.searchPrompts}
                  value={historySearchQuery}
                  onChange={(e) => onHistorySearchChange(e.target.value)}
                  disabled={promptHistory.length === 0}
                  className="w-full pl-9 pr-8 py-2 bg-[#151720] border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:border-purple-500/50 focus:bg-[#191b24] transition-all"
                />
                <svg
                  className="absolute left-2.5 top-3 h-4 w-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => onHistorySearchChange('')}
                    className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300"
                  >
                    <span className="sr-only">Clear search</span>
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onClearHistory}
                disabled={promptHistory.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-800 bg-[#151720] py-2 text-xs font-semibold text-gray-300 hover:border-red-500/60 hover:text-red-300 hover:bg-[#201f2a] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear History
              </button>
            </div>
            <div className="mt-3 border-t border-gray-800/60 pt-3 max-h-48 overflow-y-auto custom-scrollbar">
              {promptHistory.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">{t.noPromptHistoryRecorded}</div>
              ) : filteredPromptHistory.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  {t.noPromptsFound ?? 'No prompts found.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPromptHistory.map((prompt, index) => {
                    const originalIndex = promptHistory.indexOf(prompt);
                    const displayNumber =
                      originalIndex >= 0 ? promptHistory.length - originalIndex : promptHistory.length - index;

                    return (
                      <button
                        key={`${prompt}-${index}`}
                        type="button"
                        onClick={() => onSelectHistoryPrompt(prompt)}
                        className="w-full rounded-lg bg-[#1f212b] px-3 py-2 text-left text-sm text-gray-200 hover:bg-[#242733]"
                      >
                        <p className="text-[11px] uppercase tracking-wide text-purple-400/80 mb-1">
                          Prompt #{displayNumber}
                        </p>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{prompt}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-3 border-t border-gray-800/60 pt-2 text-center text-[11px] text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-700/50 rounded border border-gray-600 mr-1">alt+up/down</kbd>
              to switch between prompts.
            </div>
          </div>
        )}
      </div>

      {showNegativePrompt && (
        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-300 mb-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 mr-2"></span>
            {t.negativePromptLabel}
          </label>
          <Textarea
            value={negativePrompt}
            onChange={(e) => onNegativePromptChange(e.target.value)}
            placeholder={t.enterNegativePrompt}
            className="min-h-[100px] resize-none bg-[#11131b] border border-gray-800/70 focus:border-orange-400/70 transition-colors text-[13px] leading-relaxed"
          />
        </div>
      )}
    </div>
  );
};
