import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle, X } from 'lucide-react';

interface SaveSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  galleryName: string;
}

export const SaveSuccessModal: React.FC<SaveSuccessModalProps> = ({
  open,
  onOpenChange,
  galleryName,
}) => {
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
              Image Saved Successfully!
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="text-center text-gray-300 mb-6">
              Your image has been saved to{' '}
              <span className="font-semibold text-cyan-400">"{galleryName}"</span>{' '}
              gallery.
            </Dialog.Description>

            {/* OK Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25"
            >
              OK
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
