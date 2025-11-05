import React from 'react';
import { InfoModal } from '../InfoModal';
import { SettingsModal } from '../SettingsModal';
import { SaveSuccessModal } from '../SaveSuccessModal';
import { CategoryManagementModal } from '../CategoryManagementModal';
import { TemplateManagementModal } from '../TemplateManagementModal';

interface HeaderModalsProps {
  showInfoModal: boolean;
  showSettingsModal: boolean;
  showSaveSuccessModal: boolean;
  showCategoryModal: boolean;
  showTemplateModal: boolean;
  savedGalleryName: string;
  savedImagePath: string | undefined;
  savedImageData: string | undefined;
  onInfoModalChange: (open: boolean) => void;
  onSettingsModalChange: (open: boolean) => void;
  onSaveSuccessModalChange: (open: boolean) => void;
  onCategoryModalChange: (open: boolean) => void;
  onTemplateModalChange: (open: boolean) => void;
}

export const HeaderModals: React.FC<HeaderModalsProps> = ({
  showInfoModal,
  showSettingsModal,
  showSaveSuccessModal,
  showCategoryModal,
  showTemplateModal,
  savedGalleryName,
  savedImagePath,
  savedImageData,
  onInfoModalChange,
  onSettingsModalChange,
  onSaveSuccessModalChange,
  onCategoryModalChange,
  onTemplateModalChange,
}) => {
  return (
    <>
      <InfoModal open={showInfoModal} onOpenChange={onInfoModalChange} />
      <SettingsModal open={showSettingsModal} onOpenChange={onSettingsModalChange} />
      <SaveSuccessModal
        open={showSaveSuccessModal}
        onOpenChange={onSaveSuccessModalChange}
        galleryName={savedGalleryName}
        savedPath={savedImagePath}
        imageData={savedImageData}
      />
      <CategoryManagementModal open={showCategoryModal} onOpenChange={onCategoryModalChange} />
      <TemplateManagementModal open={showTemplateModal} onOpenChange={onTemplateModalChange} />
    </>
  );
};
