import React from 'react';
import { TemplateManagementPage } from './TemplateManagementPage';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';

interface TemplateManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TemplateManagementModal: React.FC<TemplateManagementModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl w-full h-[85vh] overflow-hidden p-0 bg-transparent border border-vis-border rounded-2xl shadow-vis-glow-teal"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Template management</DialogTitle>
        <TemplateManagementPage onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
