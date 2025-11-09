import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { PromptHint } from '../types';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';

const categoryColors = {
  subject: 'bg-vis-teal-500/10 border-vis-teal-500/30 text-vis-teal-400',
  scene: 'bg-vis-cyan-500/10 border-vis-cyan-500/30 text-vis-cyan-400',
  action: 'bg-vis-purple-500/10 border-vis-purple-500/30 text-vis-purple-400',
  style: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  camera: 'bg-vis-teal-600/10 border-vis-teal-600/30 text-vis-teal-300',
};

interface PromptHintsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromptHints: React.FC<PromptHintsProps> = ({ open, onOpenChange }) => {
  const { language } = useAppStore();
  const t = getTranslation(language);

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
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-vis-border-light rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto z-50 shadow-vis-glow-teal">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-vis-teal-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-vis-teal-400 to-vis-cyan-400"></span>
              {t.promptQualityTips}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-vis-text-secondary hover:text-vis-teal-300 hover:bg-gray-800/50">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            {promptHints.map((hint, index) => (
              <div key={index} className="space-y-2 p-3 rounded-lg bg-gray-800/30 border border-vis-border hover:border-vis-border-light transition-all duration-200">
                <div className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${categoryColors[hint.category]}`}>
                  {getCategoryLabel(hint.category)}
                </div>
                <p className="text-sm text-vis-text-primary leading-relaxed">{hint.text}</p>
                <p className="text-sm text-vis-text-muted italic leading-relaxed">{hint.example}</p>
              </div>
            ))}
            
            <div className="p-4 bg-gray-800/50 rounded-lg border border-vis-border-light mt-6 shadow-vis-glow-teal">
              <p className="text-sm text-vis-text-primary leading-relaxed">
                <strong className="text-vis-teal-400">{t.bestPractice}</strong> {t.bestPracticeHint}
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};