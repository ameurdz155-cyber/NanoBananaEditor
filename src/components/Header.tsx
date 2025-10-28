import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { HelpCircle, Settings, Sparkles } from 'lucide-react';
import { InfoModal } from './InfoModal';
import { SettingsModal } from './SettingsModal';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';

export const Header: React.FC = () => {
  const { language } = useAppStore();
  const t = getTranslation(language);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Listen for custom event to open settings
  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettingsModal(true);
    };
    
    window.addEventListener('openSettings', handleOpenSettings);
    return () => window.removeEventListener('openSettings', handleOpenSettings);
  }, []);

  return (
    <>
      <header className="h-16 glass flex items-center justify-between px-6 relative z-10 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 gradient-glow opacity-60 blur-xl rounded-full"></div>
              <div className="relative w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gradient hidden md:block" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {t.appName}
              </h1>
              <h1 className="text-xl font-bold text-gradient md:hidden" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {t.appName}
              </h1>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.appSubtitle}</span>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full glass-hover glass text-xs font-semibold" style={{ color: 'var(--accent-cyan)' }}>
            {t.versionBadge}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            className="glass glass-hover" 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSettingsModal(true)}
            title="Settings"
          >
            <Settings className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </Button>
          <Button 
            className="glass glass-hover" 
            variant="ghost" 
            size="icon"
            onClick={() => {
              // Auto-approved improvements - modal disabled
              console.log('Info improvements auto-applied');
            }}
            title="About"
          >
            <HelpCircle className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </Button>
        </div>
      </header>
      
      <InfoModal open={showInfoModal} onOpenChange={setShowInfoModal} />
      <SettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />
    </>
  );
};