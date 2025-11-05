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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(
          "fixed inset-0 backdrop-blur-sm z-50",
          isDarkMode ? "bg-black/60" : "bg-black/40"
        )} />
        <Dialog.Content className={cn(
          "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 w-full max-w-md z-50 shadow-2xl border transition-colors",
          isDarkMode 
            ? "bg-gray-950 border-gray-800" 
            : "bg-white border-gray-200"
        )}>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  isDarkMode 
                    ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20" 
                    : "bg-gradient-to-br from-purple-100 to-pink-100"
                )}>
                  <Key className={cn(
                    "h-5 w-5",
                    isDarkMode ? "text-purple-400" : "text-purple-600"
                  )} />
                </div>
                <Dialog.Title className={cn(
                  "text-xl font-bold",
                  isDarkMode ? "text-white" : "text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"
                )}>
                  {t.settings}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-8 w-8",
                    isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100"
                  )}
                >
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
          
            <div className="space-y-4">
              {/* Language Selector */}
              <div className={cn(
                "p-4 rounded-xl border",
                isDarkMode 
                  ? "bg-blue-900/20 border-blue-500/30" 
                  : "bg-blue-50/50 border-blue-200/50"
              )}>
                <div className="flex items-center mb-3">
                  <Globe className={cn(
                    "h-4 w-4 mr-2",
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  )} />
                  <label htmlFor="language" className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-blue-300" : "text-blue-700"
                  )}>
                    {t.language}
                  </label>
                </div>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className={cn(
                    "w-full h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                    isDarkMode 
                      ? "bg-gray-900 border border-gray-700 text-gray-100" 
                      : "bg-white border border-gray-300 text-gray-900"
                  )}
                >
                  <option value="en">English</option>
                  <option value="zh">中文 (Chinese)</option>
                </select>
                <p className={cn(
                  "text-xs mt-2",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                )}>
                  {t.selectLanguage}
                </p>
              </div>

              {/* Auto-Save Toggle */}
              <div className={cn(
                "p-4 rounded-xl border",
                isDarkMode 
                  ? "bg-cyan-900/20 border-cyan-500/30" 
                  : "bg-cyan-50/50 border-cyan-200/50"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <Save className={cn(
                      "h-4 w-4 mr-2",
                      isDarkMode ? "text-cyan-400" : "text-cyan-600"
                    )} />
                    <div className="flex-1">
                      <label 
                        htmlFor="auto-save-toggle" 
                        className={cn(
                          "text-sm font-medium cursor-pointer",
                          isDarkMode ? "text-cyan-300" : "text-cyan-700"
                        )}
                      >
                        {language === 'zh' ? '自动保存' : 'Auto-Save'}
                      </label>
                      <p className={cn(
                        "text-xs mt-0.5",
                        isDarkMode ? "text-gray-400" : "text-gray-600"
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
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
                      isDarkMode ? "focus:ring-offset-gray-900" : "focus:ring-offset-white",
                      autoSaveEnabled
                        ? "bg-cyan-600"
                        : isDarkMode
                          ? "bg-gray-700"
                          : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
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
                  ? "bg-green-900/20 border-green-500/30" 
                  : "bg-green-50/50 border-green-200/50"
              )}>
                <div className="flex items-center mb-3">
                  <Folder className={cn(
                    "h-4 w-4 mr-2",
                    isDarkMode ? "text-green-400" : "text-green-600"
                  )} />
                  <label className={cn(
                    "text-sm font-medium",
                    isDarkMode ? "text-green-300" : "text-green-700"
                  )}>
                    {t.savePath}
                  </label>
                </div>
                
                {isTauri ? (
                  <>
                    <div className={cn(
                      "mb-3 p-2 rounded-lg border",
                      isDarkMode 
                        ? "bg-gray-900/50 border-gray-700" 
                        : "bg-gray-50 border-gray-300"
                    )}>
                      <p className={cn(
                        "text-xs break-all",
                        isDarkMode ? "text-gray-300" : "text-gray-700"
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
                      ? "bg-gray-900/50 border-gray-700" 
                      : "bg-gray-50 border-gray-300"
                  )}>
                    <p className={cn(
                      "text-xs text-center",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )}>
                      {t.desktopAppOnly}
                    </p>
                  </div>
                )}
                
                <p className={cn(
                  "text-xs mt-2",
                  isDarkMode ? "text-gray-400" : "text-gray-600"
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