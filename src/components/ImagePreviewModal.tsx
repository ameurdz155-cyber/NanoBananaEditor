import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
  description?: string;
  metadata?: {
    timestamp?: number;
    seed?: number | null;
    temperature?: number;
    negativePrompt?: string;
    maskUsed?: boolean;
    aspectRatio?: string;
  };
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ 
  open, 
  onOpenChange, 
  imageUrl, 
  title, 
  description,
  metadata
}) => {
  const { language } = useAppStore();
  const t = getTranslation(language);
  
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-100">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            {/* Image */}
            <div className="bg-gray-800 rounded-lg p-4">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-auto rounded-lg border border-gray-700"
              />
            </div>
            
            {/* Prompt */}
            {description && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t.prompt}</h4>
                <p className="text-sm text-gray-200 leading-relaxed">{description}</p>
              </div>
            )}
            
            {/* Metadata Details */}
            {metadata && (
              <div className="grid grid-cols-2 gap-3">
                {metadata.timestamp && (
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.created}</h4>
                    <p className="text-sm text-gray-200">
                      {new Date(metadata.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {metadata.aspectRatio && (
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.aspectRatio}</h4>
                    <p className="text-sm text-gray-200 font-mono">{metadata.aspectRatio}</p>
                  </div>
                )}
                
                {metadata.seed !== undefined && metadata.seed !== null && (
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.seed}</h4>
                    <p className="text-sm text-gray-200 font-mono">{metadata.seed}</p>
                  </div>
                )}
                
                {metadata.temperature !== undefined && (
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t.creativity}</h4>
                    <p className="text-sm text-gray-200">{metadata.temperature}</p>
                  </div>
                )}
                
                {metadata.maskUsed && (
                  <div className="bg-purple-900/30 rounded-lg p-3 border border-gray-700">
                    <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">{t.mask}</h4>
                    <p className="text-sm text-purple-200">{t.applied}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Negative Prompt */}
            {metadata?.negativePrompt && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t.negativePrompt}</h4>
                <p className="text-sm text-gray-200 leading-relaxed">{metadata.negativePrompt}</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};