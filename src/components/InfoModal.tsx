import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ExternalLink, Lightbulb, Download } from 'lucide-react';
import { Button } from './ui/Button';

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-4xl z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-100">
              About AI Image Studio Pro
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3 text-sm text-gray-300">
              <p className="text-base">
                Professional AI-powered image generation and editing desktop application.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-lg border border-purple-500/30">
                  <div className="flex items-center mb-3">
                    <Lightbulb className="h-5 w-5 text-purple-400 mr-2" />
                    <h4 className="text-sm font-semibold text-purple-300">
                      Powerful AI Features
                    </h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">
                    Create stunning images from text prompts, edit with natural language, and use advanced masking tools for precise control.
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
                  <div className="flex items-center mb-3">
                    <Download className="h-5 w-5 text-purple-400 mr-2" />
                    <h4 className="text-sm font-semibold text-purple-300">
                      Desktop Application
                    </h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">
                    Optimized for desktop use with offline caching, project management, and full history tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};