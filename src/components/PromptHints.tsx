import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { PromptHint } from '../types';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { cn } from '../lib/utils';

const categoryColors = {
  dark: {
    subject: 'bg-vis-teal-500/10 border-vis-teal-500/30 text-vis-teal-400',
    scene: 'bg-vis-cyan-500/10 border-vis-cyan-500/30 text-vis-cyan-400',
    action: 'bg-vis-purple-500/10 border-vis-purple-500/30 text-vis-purple-400',
    style: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    camera: 'bg-vis-teal-600/10 border-vis-teal-600/30 text-vis-teal-300',
  },
  light: {
    subject: 'bg-teal-50 border-teal-200 text-teal-700',
    scene: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    action: 'bg-purple-50 border-purple-200 text-purple-700',
    style: 'bg-orange-50 border-orange-200 text-orange-700',
    camera: 'bg-teal-100 border-teal-300 text-teal-800',
  }
};

interface PromptHintsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromptHints: React.FC<PromptHintsProps> = ({ open, onOpenChange }) => {
  const { language } = useAppStore();
  const t = getTranslation(language);
  
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    return savedTheme !== 'light';
  });

  React.useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem('app-theme');
      setIsDarkMode(savedTheme !== 'light');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  const promptHints: PromptHint[] = [
    {
      category: 'subject',
      text: t.subjectHint,
      example: t.subjectExample
    },
    {
      category: 'scene',
      text: t.sceneHint,
      example: t.sceneExample
    },
    {
      category: 'action',
      text: t.actionHint,
      example: t.actionExample
    },
    {
      category: 'style',
      text: t.styleHint,
      example: t.styleExample
    },
    {
      category: 'camera',
      text: t.cameraHint,
      example: t.cameraExample
    }
  ];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'subject': return t.subject;
      case 'scene': return t.scene;
      case 'action': return t.action;
      case 'style': return t.style;
      case 'camera': return t.camera;
      default: return category;
    }
  };

  const descriptionId = React.useId();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(
          'fixed inset-0 backdrop-blur-sm z-50',
          isDarkMode ? 'bg-black/60' : 'bg-black/40'
        )} />
        <Dialog.Content 
          aria-describedby={descriptionId}
          className={cn(
            'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto z-50 border',
            isDarkMode
              ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-vis-border-light shadow-vis-glow-teal'
              : 'bg-white border-slate-200 shadow-2xl'
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className={cn(
              'text-lg font-semibold flex items-center gap-2',
              isDarkMode ? 'text-vis-teal-300' : 'text-teal-600'
            )}>
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-vis-teal-400 to-vis-cyan-400"></span>
              {t.promptQualityTips}
            </Dialog.Title>
            <Dialog.Description id={descriptionId} className="sr-only">
              {t.promptQualityTips} — {t.bestPractice}
            </Dialog.Description>
            <Dialog.Close asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  'h-6 w-6 transition-colors',
                  isDarkMode
                    ? 'text-vis-text-secondary hover:text-vis-teal-300 hover:bg-gray-800/50'
                    : 'text-slate-500 hover:text-teal-600 hover:bg-slate-100'
                )}
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            {promptHints.map((hint, index) => (
              <div 
                key={index} 
                className={cn(
                  'space-y-2 p-3 rounded-lg border transition-all duration-200',
                  isDarkMode
                    ? 'bg-gray-800/30 border-vis-border hover:border-vis-border-light'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                )}
              >
                <div className={cn(
                  'inline-block px-2 py-1 rounded-md text-xs font-medium border',
                  isDarkMode ? categoryColors.dark[hint.category] : categoryColors.light[hint.category]
                )}>
                  {getCategoryLabel(hint.category)}
                </div>
                <p className={cn(
                  'text-sm leading-relaxed',
                  isDarkMode ? 'text-vis-text-primary' : 'text-slate-900'
                )}>{hint.text}</p>
                <p className={cn(
                  'text-sm italic leading-relaxed',
                  isDarkMode ? 'text-vis-text-muted' : 'text-slate-600'
                )}>{hint.example}</p>
              </div>
            ))}
            
            <div className={cn(
              'p-4 rounded-lg border mt-6',
              isDarkMode
                ? 'bg-gray-800/50 border-vis-border-light shadow-vis-glow-teal'
                : 'bg-slate-50 border-slate-200 shadow-sm'
            )}>
              <p className={cn(
                'text-sm leading-relaxed',
                isDarkMode ? 'text-vis-text-primary' : 'text-slate-900'
              )}>
                <strong className={cn(
                  isDarkMode ? 'text-vis-teal-400' : 'text-teal-600'
                )}>{t.bestPractice}</strong> {t.bestPracticeHint}
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};