import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { PromptHint } from '../types';
import { Button } from './ui/Button';

const promptHints: PromptHint[] = [
  {
    category: 'subject',
    text: 'Be specific about the main subject',
    example: '"A vintage red bicycle" vs "bicycle"'
  },
  {
    category: 'scene',
    text: 'Describe the environment and setting',
    example: '"in a cobblestone alley during golden hour"'
  },
  {
    category: 'action',
    text: 'Include movement or activity',
    example: '"cyclist pedaling through puddles"'
  },
  {
    category: 'style',
    text: 'Specify artistic style or mood',
    example: '"cinematic photography, moody lighting"'
  },
  {
    category: 'camera',
    text: 'Add camera perspective details',
    example: '"shot with 85mm lens, shallow depth of field"'
  }
];

const categoryColors = {
  subject: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  scene: 'bg-green-500/10 border-green-500/30 text-green-400',
  action: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  style: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  camera: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
};

interface PromptHintsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PromptHints: React.FC<PromptHintsProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-100">
              Prompt Quality Tips
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            {promptHints.map((hint, index) => (
              <div key={index} className="space-y-2">
                <div className={`inline-block px-2 py-1 rounded text-xs border ${categoryColors[hint.category]}`}>
                  {hint.category}
                </div>
                <p className="text-sm text-gray-300">{hint.text}</p>
                <p className="text-sm text-gray-500 italic">{hint.example}</p>
              </div>
            ))}
            
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 mt-6">
              <p className="text-sm text-gray-300">
                <strong className="text-purple-400">Best practice:</strong> Write full sentences that describe the complete scene, 
                not just keywords. Think "paint me a picture with words."
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};