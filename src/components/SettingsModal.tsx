import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Globe, Folder, FolderOpen, Key, Save } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';
import { useAppStore } from '../store/useAppStore';
import { getTranslation, Language } from '../i18n/translations';
import { isTauriEnvironment } from '../utils/fileSaver';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const resolveIsDarkMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  const savedTheme = localStorage.getItem('app-theme');
  if (savedTheme === 'light') {
    return false;
  }
  if (savedTheme === 'dark') {
    return true;
  }
  return document.documentElement.classList.contains('dark');
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { language, setLanguage, savePath, setSavePath, autoSaveEnabled, setAutoSaveEnabled } = useAppStore();
  const t = getTranslation(language);
  const isTauri = isTauriEnvironment();
  
  const [isDarkMode, setIsDarkMode] = useState(resolveIsDarkMode);

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(resolveIsDarkMode());
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  useEffect(() => {
    if (open) {
      setIsDarkMode(resolveIsDarkMode());
    }
  }, [open]);

  const handleChooseFolder = async () => {
    if (!isTauri) return;
    
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: t.chooseFolder,
      });
      
      if (selected && typeof selected === 'string') {
        setSavePath(selected);
      }
    } catch (error) {
      console.error('Error choosing folder:', error);
    }
  };

  const handleOpenFolder = async () => {
    if (!isTauri || !savePath) return;
    
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('plugin:shell|open', { path: savePath });
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const descriptionId = React.useId();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(
          "fixed inset-0 backdrop-blur-sm z-50",
          isDarkMode ? "bg-black/60" : "bg-black/30"
        )} />
        <Dialog.Content 
          aria-describedby={descriptionId}
          className={cn(
          "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-full max-w-md z-50 border transition-colors",
          isDarkMode 
            ? "bg-vis-panel border-vis-border shadow-vis-glow-teal" 
            : "bg-white border-vis-border-light shadow-xl shadow-vis-teal-500/10"
        )}>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-xl border",
                  isDarkMode 
                    ? "bg-gradient-to-br from-vis-teal-500/20 to-vis-cyan-500/20 border-vis-teal-500/30" 
                    : "bg-gradient-to-br from-vis-teal-50 to-vis-cyan-50 border-vis-teal-200"
                )}>
                  <Key className={cn(
                    "h-5 w-5",
                    isDarkMode ? "text-vis-teal-400" : "text-vis-teal-600"
                  )} />
                </div>
                <Dialog.Title className={cn(
                  "text-xl font-bold",
                  isDarkMode 
                    ? "text-vis-text-primary" 
                    : "text-transparent bg-clip-text bg-gradient-to-r from-vis-teal-600 to-vis-cyan-600"
                )}>
                  {t.settings}
                </Dialog.Title>
                <Dialog.Description id={descriptionId} className="sr-only">
                  {t.settings} — Configure API key and preferences
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-8 w-8 border",
                    isDarkMode 
                      ? "border-vis-border hover:bg-vis-teal-500/10 hover:border-vis-teal-500/50" 
                      : "border-vis-border-light hover:bg-vis-teal-50 hover:border-vis-teal-300"
                  )}
                >
                  <X className={cn("h-5 w-5", isDarkMode ? "text-vis-text-secondary" : "text-gray-600")} />
                </Button>
              </Dialog.Close>
            </div>
          
            <div className="space-y-4">
              {/* Language Selector */}
              <div className={cn(
                "p-4 rounded-xl border",
                isDarkMode 
                  ? "bg-vis-teal-500/10 border-vis-teal-500/30" 
                  : "bg-vis-teal-50/50 border-vis-teal-200"
              )}>
                <div className="flex items-center mb-3">
                  <Globe className={cn(
                    "h-4 w-4 mr-2",
                    isDarkMode ? "text-vis-teal-400" : "text-vis-teal-600"
                  )} />
                  <label htmlFor="language" className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-vis-teal-300" : "text-vis-teal-700"
                  )}>
                    {t.language}
                  </label>
                </div>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className={cn(
                    "w-full h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors",
                    isDarkMode 
                      ? "bg-vis-card border border-vis-border text-vis-text-primary focus:ring-vis-teal-500" 
                      : "bg-white border border-vis-border-light text-gray-900 focus:ring-vis-teal-400"
                  )}
                >
                  <option value="en">English</option>
                  <option value="zh">中文 (Chinese)</option>
                </select>
                <p className={cn(
                  "text-xs mt-2",
                  isDarkMode ? "text-vis-text-muted" : "text-gray-600"
                )}>
                  {t.selectLanguage}
                </p>
              </div>

              {/* Auto-Save Toggle */}
              <div className={cn(
                "p-4 rounded-xl border",
                isDarkMode 
                  ? "bg-vis-cyan-500/10 border-vis-cyan-500/30" 
                  : "bg-vis-cyan-50/50 border-vis-cyan-200"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <Save className={cn(
                      "h-4 w-4 mr-2",
                      isDarkMode ? "text-vis-cyan-400" : "text-vis-cyan-600"
                    )} />
                    <div className="flex-1">
                      <label 
                        htmlFor="auto-save-toggle" 
                        className={cn(
                          "text-sm font-medium cursor-pointer",
                          isDarkMode ? "text-vis-cyan-300" : "text-vis-cyan-700"
                        )}
                      >
                        {language === 'zh' ? '自动保存' : 'Auto-Save'}
                      </label>
                      <p className={cn(
                        "text-xs mt-0.5",
                        isDarkMode ? "text-vis-text-muted" : "text-gray-600"
                      )}>
                        {language === 'zh' 
                          ? '生成后自动保存图像到画廊' 
                          : 'Automatically save images to gallery after generation'}
                      </p>
                    </div>
                  </div>
                  <button
                    id="auto-save-toggle"
                    role="switch"
                    aria-checked={autoSaveEnabled}
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isDarkMode 
                        ? "focus:ring-vis-cyan-500 focus:ring-offset-vis-panel" 
                        : "focus:ring-vis-cyan-400 focus:ring-offset-white",
                      autoSaveEnabled
                        ? isDarkMode ? "bg-vis-cyan-600" : "bg-vis-cyan-500"
                        : isDarkMode
                          ? "bg-vis-border"
                          : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                        autoSaveEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Save Path Section - Desktop App Only */}
              <div className={cn(
                "p-4 rounded-xl border",
                isDarkMode 
                  ? "bg-vis-teal-500/10 border-vis-teal-500/30" 
                  : "bg-vis-teal-50/50 border-vis-teal-200"
              )}>
                <div className="flex items-center mb-3">
                  <Folder className={cn(
                    "h-4 w-4 mr-2",
                    isDarkMode ? "text-vis-teal-400" : "text-vis-teal-600"
                  )} />
                  <label className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-vis-teal-300" : "text-vis-teal-700"
                  )}>
                    {t.savePath}
                  </label>
                </div>
                
                {isTauri ? (
                  <>
                    <div className={cn(
                      "mb-3 p-2 rounded-lg border",
                      isDarkMode 
                        ? "bg-vis-card/50 border-vis-border" 
                        : "bg-gray-50 border-vis-border-light"
                    )}>
                      <p className={cn(
                        "text-xs break-all",
                        isDarkMode ? "text-vis-text-secondary" : "text-gray-700"
                      )}>
                        {savePath || t.defaultSavePath}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={handleChooseFolder}
                        className="flex-1"
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        {t.chooseFolder}
                      </Button>
                      
                      {savePath && (
                        <Button
                          variant="secondary"
                          onClick={handleOpenFolder}
                          className="flex-1"
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          {t.openFolder}
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={cn(
                    "p-3 rounded-lg border",
                    isDarkMode 
                      ? "bg-vis-card/50 border-vis-border" 
                      : "bg-gray-50 border-vis-border-light"
                  )}>
                    <p className={cn(
                      "text-xs text-center",
                      isDarkMode ? "text-vis-text-muted" : "text-gray-600"
                    )}>
                      {t.desktopAppOnly}
                    </p>
                  </div>
                )}
                
                <p className={cn(
                  "text-xs mt-2",
                  isDarkMode ? "text-vis-text-muted" : "text-gray-600"
                )}>
                  {t.savePathDescription}
                </p>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};