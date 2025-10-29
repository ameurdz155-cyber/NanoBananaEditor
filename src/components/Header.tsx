import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { HelpCircle, Settings } from 'lucide-react';
import { InfoModal } from './InfoModal';
import { SettingsModal } from './SettingsModal';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import logoHeader from '../assets/AI-POD-lite-logo.png';

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
            <img 
              src={logoHeader} 
              alt={t.appName}
              className="h-10 object-contain"
            />
          </div>
          <div className="px-3 py-1 text-xs font-semibold" style={{ color: 'var(--accent-cyan)', border: 'none', background: 'transparent' }}>
            {t.versionBadge}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            className="glass glass-hover" 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSettingsModal(true)}
            title={t.settings}
          >
            <Settings className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
          </Button>
          <Button 
            className="glass glass-hover" 
            variant="ghost" 
            size="icon"
            onClick={() => setShowInfoModal(true)}
            title={t.about}
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