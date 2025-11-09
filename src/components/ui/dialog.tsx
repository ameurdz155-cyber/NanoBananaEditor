"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

const DialogPortal = ({ children, ...props }: DialogPrimitive.DialogPortalProps) => (
  <DialogPrimitive.Portal {...props}>
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
      {children}
    </div>
  </DialogPrimitive.Portal>
);
DialogPortal.displayName = DialogPrimitive.Portal.displayName;

const DialogOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(
  ({ className, ...props }, ref) => {
    const [isDarkMode, setIsDarkMode] = React.useState(() => {
      if (typeof window === 'undefined') return true;
      const savedTheme = localStorage.getItem('app-theme');
      return savedTheme !== 'light';
    });

    React.useEffect(() => {
      const handleThemeChange = () => {
        const savedTheme = localStorage.getItem('app-theme');
        setIsDarkMode(savedTheme !== 'light');
      };

      window.addEventListener('themeChange', handleThemeChange);
      return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    return (
      <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 backdrop-blur-sm transition-colors",
          isDarkMode ? "bg-black/80" : "bg-black/40",
          className,
        )}
        {...props}
      />
    );
  },
);
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(
  ({ className, children, ...props }, ref) => {
    const [isDarkMode, setIsDarkMode] = React.useState(() => {
      if (typeof window === 'undefined') return true;
      const savedTheme = localStorage.getItem('app-theme');
      return savedTheme !== 'light';
    });

    React.useEffect(() => {
      const handleThemeChange = () => {
        const savedTheme = localStorage.getItem('app-theme');
        setIsDarkMode(savedTheme !== 'light');
      };

      window.addEventListener('themeChange', handleThemeChange);
      return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "relative z-50 grid w-full max-w-lg gap-4 border p-6 shadow-lg sm:rounded-lg transition-colors",
            isDarkMode 
              ? "border-vis-border bg-gray-900/95 backdrop-blur-sm text-vis-text-primary" 
              : "border-purple-200/60 bg-white text-gray-800 shadow-xl",
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className={cn(
            "absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none",
            isDarkMode 
              ? "ring-offset-gray-900 focus:ring-vis-teal-400" 
              : "ring-offset-white focus:ring-purple-400"
          )}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  },
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
