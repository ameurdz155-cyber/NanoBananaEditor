import React, { useState } from 'react';
import { AlertTriangle, CreditCard, CheckCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

interface CreditsDisplayProps {
  credits: number;
  onPurchase?: () => void;
  className?: string;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({
  credits,
  onPurchase,
  className,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasNoCredits = credits === 0;
  const isLowCredits = credits > 0 && credits < 10;

  const handlePurchaseClick = () => {
    setIsModalOpen(true);
  };

  const handlePurchase = () => {
    // Call the onPurchase callback if provided
    if (onPurchase) {
      onPurchase();
    }
    // Here you would integrate with Stripe or your payment provider
    console.log('Initiating purchase...');
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Credits Display Card */}
      <div
        className={cn(
          'rounded-lg border transition-all duration-200 shadow-sm',
          hasNoCredits
            ? 'bg-red-900/20 dark:bg-red-900/30 border-red-700/50 dark:border-red-600/50'
            : isLowCredits
            ? 'bg-amber-900/20 dark:bg-amber-900/30 border-amber-700/50 dark:border-amber-600/50'
            : 'bg-gray-900/70 dark:bg-gray-800/80 border-gray-800/60 dark:border-gray-700/60',
          className
        )}
      >
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle
                className={cn(
                  'h-4 w-4',
                  hasNoCredits
                    ? 'text-red-400 dark:text-red-300'
                    : isLowCredits
                    ? 'text-amber-400 dark:text-amber-300'
                    : 'text-gray-400 dark:text-gray-300'
                )}
              />
              <span className="text-sm font-medium text-gray-300 dark:text-gray-200">
                Credits
              </span>
            </div>
            <span
              className={cn(
                'text-xs px-2 py-1 rounded',
                hasNoCredits
                  ? 'bg-red-400/20 text-red-300 dark:bg-red-400/30 dark:text-red-200'
                  : isLowCredits
                  ? 'bg-amber-400/20 text-amber-300 dark:bg-amber-400/30 dark:text-amber-200'
                  : 'bg-vis-teal-500/20 text-vis-teal-300 dark:bg-vis-teal-500/30 dark:text-vis-teal-200'
              )}
            >
              {credits} credits
            </span>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-300">
              <span>Credits:</span>
              <span>{credits}</span>
            </div>
            {hasNoCredits && (
              <p className="text-xs text-red-300 dark:text-red-200">
                No credits remaining. Purchase more credits to continue.
              </p>
            )}
            {isLowCredits && (
              <p className="text-xs text-amber-300 dark:text-amber-200">
                Low credits remaining. Consider purchasing more.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 space-y-2">
            <button
              onClick={handlePurchaseClick}
              className={cn(
                'w-full px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm',
                'bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500',
                'hover:from-vis-teal-600 hover:to-vis-cyan-600',
                'text-white shadow-lg hover:shadow-xl shadow-vis-glow-teal',
                'focus:outline-none focus:ring-2 focus:ring-vis-teal-400 focus:ring-offset-2 focus:ring-offset-gray-900',
                'dark:shadow-vis-glow-teal dark:hover:shadow-vis-glow-teal-lg'
              )}
            >
              Purchase 100 Credits ($10)
            </button>
            <div className="p-2 bg-blue-900/20 dark:bg-blue-900/30 border border-blue-700/50 dark:border-blue-600/50 rounded text-xs">
              <p className="text-blue-200/80 dark:text-blue-200 text-center">
                Each generation or edit or upscale costs 1 credit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-100 dark:text-white">
              Purchase Credits
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Credit Package Card */}
            <div className="p-4 bg-gray-800 dark:bg-gray-800/90 rounded-lg border border-gray-700 dark:border-gray-600">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-100 dark:text-white mb-1">
                    AI POD Lite (100 Credits)
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mb-2">
                    Generate, edit, or upscale 100 images with AI POD Lite.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-vis-teal-400 dark:text-vis-teal-300">$10</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(100 credits)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-300">
                  <span>Total operations:</span>
                  <span>100</span>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                className={cn(
                  'w-full mt-4 h-10 px-4 py-2 rounded-lg',
                  'bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500',
                  'hover:from-vis-teal-600 hover:to-vis-cyan-600',
                  'text-white font-medium text-sm',
                  'transition-all duration-200',
                  'shadow-lg hover:shadow-xl shadow-vis-glow-teal',
                  'flex items-center justify-center gap-2',
                  'focus:outline-none focus:ring-2 focus:ring-vis-teal-400 focus:ring-offset-2 focus:ring-offset-gray-900',
                  'dark:shadow-vis-glow-teal dark:hover:shadow-vis-glow-teal-lg'
                )}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Purchase Credits
              </button>
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-blue-900/20 dark:bg-blue-900/30 border border-blue-700/50 dark:border-blue-600/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-400 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-200 dark:text-blue-100">
                  <p className="font-medium mb-1">Secure Payment</p>
                  <p>
                    Powered by (Your Payment Methode ). Your payment information is encrypted and
                    secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
