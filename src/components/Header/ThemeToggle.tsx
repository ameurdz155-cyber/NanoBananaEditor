import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface ThemeToggleProps {
  isDarkMode: boolean;
  language: string;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, language, onToggle }) => {
  const title = isDarkMode
    ? language === 'zh'
      ? '切换到浅色模式'
      : 'Switch to Light Mode'
    : language === 'zh'
      ? '切换到深色模式'
      : 'Switch to Dark Mode';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      title={title}
      className={cn(
        'rounded-lg border-2 transition-all duration-200',
        isDarkMode
          ? 'border-purple-500/60 bg-gray-800/60 text-yellow-300 hover:bg-gray-700/70 hover:border-purple-400'
          : 'border-purple-200/80 bg-white/80 text-purple-500 hover:bg-purple-50/80 hover:border-purple-300 backdrop-blur'
      )}
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};
