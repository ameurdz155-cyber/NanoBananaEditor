import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'btn-premium text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
        secondary: 'glass glass-hover text-white border border-white/10 hover:border-white/20',
        outline: 'border-2 bg-transparent hover:bg-white/5 border-purple-500/50 text-purple-300 hover:border-purple-400',
        ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
        destructive: 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg',
      },
      size: {
        default: 'h-11 px-6 py-2 text-sm rounded-xl',
        sm: 'h-9 px-4 text-xs rounded-lg',
        lg: 'h-16 px-10 text-lg rounded-2xl',
        xl: 'h-20 px-12 text-xl rounded-2xl',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';