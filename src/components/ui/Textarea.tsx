import React from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl glass border border-purple-500/20 bg-gray-900/50 px-4 py-3 text-sm text-gray-100 ring-offset-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-purple-400/50 focus-visible:bg-gray-900/70 focus-visible:shadow-[0_0_20px_rgba(168,85,247,0.15)] disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';