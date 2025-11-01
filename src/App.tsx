import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cn } from './utils/cn';
import { Header } from './components/Header';
import { PromptComposer } from './components/PromptComposer';
import { ImageCanvas } from './components/ImageCanvas';
import { HistoryPanel } from './components/HistoryPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAppStore } from './store/useAppStore';
import { getTranslation } from './i18n/translations';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

function AppContent() {
  useKeyboardShortcuts();
  
  const { showPromptPanel, setShowPromptPanel, setShowHistory, language } = useAppStore();
  
  // Update page title when language changes
  React.useEffect(() => {
    const t = getTranslation(language);
    document.title = t.pageTitle;
  }, [language]);
  
  // Auto-hide scrollbar when not scrolling
  React.useEffect(() => {
    const scrollTimeouts = new Map<Element, NodeJS.Timeout>();
    
    const handleScrollbarVisibility = () => {
      const scrollableElements = document.querySelectorAll('.custom-scrollbar, .sidebar-scrollbar');
      
      scrollableElements.forEach((element) => {
        // Remove old listener if exists
        const oldListener = (element as any)._scrollListener;
        if (oldListener) {
          element.removeEventListener('scroll', oldListener);
        }
        
        const handleScroll = () => {
          element.classList.add('is-scrolling');
          
          const existingTimeout = scrollTimeouts.get(element);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          const timeout = setTimeout(() => {
            element.classList.remove('is-scrolling');
            scrollTimeouts.delete(element);
          }, 1000); // Hide after 1 second of no scrolling
          
          scrollTimeouts.set(element, timeout);
        };
        
        // Store listener reference for cleanup
        (element as any)._scrollListener = handleScroll;
        element.addEventListener('scroll', handleScroll);
      });
    };
    
    // Initial setup
    handleScrollbarVisibility();
    
    // Re-run when DOM changes (for dynamically added elements)
    const observer = new MutationObserver(handleScrollbarVisibility);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
      scrollTimeouts.forEach(timeout => clearTimeout(timeout));
      scrollTimeouts.clear();
    };
  }, []);
  
  // Set mobile defaults on mount
  React.useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setShowPromptPanel(false);
        setShowHistory(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setShowPromptPanel, setShowHistory]);

  return (
    <div className="h-screen flex flex-col font-sans relative" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Header />
      
      <div className="flex-1 flex overflow-hidden relative">
  <div className={cn("flex-shrink-0 transition-all duration-300 relative z-40", !showPromptPanel && "w-8")}>
          <PromptComposer />
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <ImageCanvas />
        </div>
        <div className="flex-shrink-0 relative z-10">
          <HistoryPanel />
        </div>
      </div>
      
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;