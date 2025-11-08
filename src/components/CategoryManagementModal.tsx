import React from 'react';
import { CategoryManagementPage } from './CategoryManagementPage';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl w-full h-[85vh] overflow-hidden p-0 bg-transparent border-none"
        aria-describedby={undefined}
      >
        <CategoryManagementPage onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
