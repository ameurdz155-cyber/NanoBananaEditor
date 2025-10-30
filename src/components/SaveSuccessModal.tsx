import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle, X, Download, FolderOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { isTauriEnvironment } from '../utils/fileSaver';

interface SaveSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  galleryName: string;
  savedPath?: string;
  imageData?: string;
}

export const SaveSuccessModal: React.FC<SaveSuccessModalProps> = ({
  open,
  onOpenChange,
  galleryName,
  savedPath,
  imageData,
}) => {
  const { language } = useAppStore();
  const t = getTranslation(language);
  const isTauri = isTauriEnvironment();

  const handleDownload = () => {
    if (!imageData) return;
    
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `ai-pod-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenFolder = async () => {
    if (!isTauri || !savedPath) return;
    
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      // Get the directory path from the file path
      const dirPath = savedPath.substring(0, savedPath.lastIndexOf('/'));
      await invoke('plugin:shell|open', { path: dirPath });
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in fade-in zoom-in-95">
          <div className="glass rounded-2xl border border-gray-700 p-6 shadow-2xl">
            {/* Close button */}
            <Dialog.Close className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>

            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Title */}
            <Dialog.Title className="text-xl font-bold text-center text-white mb-2">
              {t.imageSavedSuccessfully}
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="text-center text-gray-300 mb-4">
              {t.imageSavedToGallery}{' '}
              <span className="font-semibold text-cyan-400">"{galleryName}"</span>{' '}
              gallery.
            </Dialog.Description>

            {/* Path or Browser Note */}
            {isTauri && savedPath ? (
              <div className="mb-6 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">{t.savedToPath}:</p>
                <p className="text-xs text-gray-300 break-all font-mono">{savedPath}</p>
              </div>
            ) : (
              <div className="mb-6 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                <p className="text-xs text-blue-300 text-center">
                  {t.browserStorageNote}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!isTauri && imageData && (
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t.downloadImage}
                </button>
              )}
              
              {isTauri && savedPath && (
                <button
                  onClick={handleOpenFolder}
                  className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {t.openFolder}
                </button>
              )}
              
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25"
              >
                OK
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
