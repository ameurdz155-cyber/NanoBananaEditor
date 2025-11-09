import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, FolderOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { isTauriEnvironment } from '../utils/fileSaver';
import podIcon from '../assets/AI-POD-Lite-icon.png';

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
    onOpenChange(false);
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

  const descriptionId = React.useId();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content className="save-modal-content" aria-describedby={descriptionId}>
          <Dialog.Close className="save-modal-close" aria-label={t.cancel}>
            ×
          </Dialog.Close>

          <div className="save-modal-logo-wrap">
            <div className="save-modal-logo">
              <img src={podIcon} alt="AI POD logo" className="save-modal-logo-img" />
            </div>
          </div>

          <Dialog.Title className="save-modal-title">
            {t.imageSavedSuccessfully}
          </Dialog.Title>

          <Dialog.Description id={descriptionId} className="save-modal-subtitle">
            {t.imageSavedToGallery}{' '}
            <span className="save-modal-highlight">"{galleryName}"</span>{' '}
            {t.gallery}.
          </Dialog.Description>

          {isTauri && savedPath ? (
            <div className="save-modal-path">
              <p className="save-modal-path-label">{t.savedToPath}:</p>
              <p className="save-modal-path-value">{savedPath}</p>
            </div>
          ) : (
            <p className="save-modal-tip">{t.browserStorageNote}</p>
          )}

          <div className="save-modal-actions">
            {!isTauri && imageData && (
              <button onClick={handleDownload} className="save-modal-btn save-modal-btn-primary">
                <Download className="save-modal-btn-icon" />
                {t.downloadImage}
              </button>
            )}

            {isTauri && savedPath && (
              <button onClick={handleOpenFolder} className="save-modal-btn save-modal-btn-purple">
                <FolderOpen className="save-modal-btn-icon" />
                {t.openFolder}
              </button>
            )}

            <button onClick={() => onOpenChange(false)} className="save-modal-btn save-modal-btn-ghost">
              {t.ok}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
