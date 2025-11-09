import React from 'react';
import { Search, Mic, MicOff, Plus } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export interface VoiceLanguageOption {
  value: 'en-US' | 'zh-CN';
  label: string;
}

interface CategoryManagementToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  voiceLang: 'en-US' | 'zh-CN';
  onVoiceLangChange: (value: 'en-US' | 'zh-CN') => void;
  voiceLangLabel: string;
  voiceLanguageOptions: VoiceLanguageOption[];
  voiceSupported: boolean;
  listening: boolean;
  voiceButtonTitle: string;
  addButtonAriaLabel: string;
  onToggleVoiceSearch: () => void;
  onAddCategory: () => void;
}

export const CategoryManagementToolbar: React.FC<CategoryManagementToolbarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchInputRef,
  voiceLang,
  onVoiceLangChange,
  voiceLangLabel,
  voiceLanguageOptions,
  voiceSupported,
  listening,
  voiceButtonTitle,
  addButtonAriaLabel,
  onToggleVoiceSearch,
  onAddCategory,
}) => {
  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange],
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex gap-3 items-stretch">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <Search className="h-5 w-5 text-vis-text-muted" />
          </div>
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-11 h-11 rounded-xl border border-vis-border bg-gray-900/50 text-vis-text-primary placeholder:text-vis-text-muted focus-visible:border-vis-teal-400 focus-visible:bg-gray-900/70 focus-visible:ring-2 focus-visible:ring-vis-teal-500/30 transition-all duration-200"
          />
        </div>

        <Select value={voiceLang} onValueChange={onVoiceLangChange}>
          <SelectTrigger className="h-11 w-auto min-w-[110px] bg-gray-900/80 border border-vis-border text-xs text-vis-text-primary rounded-xl px-3">
            <SelectValue>{voiceLangLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-gray-900/95 text-vis-text-primary border border-vis-border-light">
            {voiceLanguageOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onToggleVoiceSearch}
          disabled={!voiceSupported}
          className={`h-11 w-11 rounded-full border flex-shrink-0 transition-all duration-200 ${listening && voiceSupported ? 'border-vis-teal-400 text-vis-teal-400 bg-vis-teal-500/10 shadow-vis-glow-teal' : 'border-vis-border bg-gray-900/80 text-vis-text-secondary hover:border-vis-border-light hover:text-vis-text-primary'} ${!voiceSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={voiceButtonTitle}
        >
          {listening && voiceSupported ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          onClick={onAddCategory}
          size="icon"
          className="h-11 w-11 rounded-full bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 hover:from-vis-teal-400 hover:to-vis-cyan-400 text-white shadow-vis-glow-teal hover:shadow-vis-glow-cyan border-0 flex-shrink-0 transition-all duration-200"
          aria-label={addButtonAriaLabel}
          type="button"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
