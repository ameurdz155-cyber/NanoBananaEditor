import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Globe, Folder, FolderOpen, Shield, Key } from 'lucide-react';
import { Button } from './ui/Button';
import {
  getStoredBackendUrl,
  getStoredApiKey,
} from '../services/apiConfig';
import { useAppStore } from '../store/useAppStore';
import { getTranslation, Language } from '../i18n/translations';
import { isTauriEnvironment } from '../utils/fileSaver';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { language, setLanguage, savePath, setSavePath } = useAppStore();
  const t = getTranslation(language);
  const isTauri = isTauriEnvironment();
  const backendUrl = React.useMemo(() => getStoredBackendUrl(), []);
  const apiKey = React.useMemo(() => getStoredApiKey(), []);

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
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 glass border border-purple-500/20 rounded-2xl p-6 w-full max-w-md z-50 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-mesh opacity-30 rounded-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                  <Key className="h-5 w-5 text-purple-400" />
                </div>
                <Dialog.Title className="text-xl font-bold text-gradient">
                  {t.settings}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>
          
            <div className="space-y-4">
              {/* Language Selector */}
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                <div className="flex items-center mb-3">
                  <Globe className="h-4 w-4 text-blue-400 mr-2" />
                  <label htmlFor="language" className="text-sm font-medium text-blue-300">
                    {t.language}
                  </label>
                </div>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="zh">中文 (Chinese)</option>
                </select>
                <p className="text-xs text-gray-400 mt-2">
                  {t.selectLanguage}
                </p>
              </div>

              {/* Save Path Section - Desktop App Only */}
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
                <div className="flex items-center mb-3">
                  <Folder className="h-4 w-4 text-green-400 mr-2" />
                  <label className="text-sm font-medium text-green-300">
                    {t.savePath}
                  </label>
                </div>
                
                {isTauri ? (
                  <>
                    <div className="mb-3 p-2 bg-gray-900/50 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-300 break-all">
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
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 text-center">
                      {t.desktopAppOnly}
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-2">
                  {t.savePathDescription}
                </p>
              </div>
              
              <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                <div className="flex items-center mb-2">
                  <Shield className="h-4 w-4 text-purple-300 mr-2" />
                  <span className="text-sm font-medium text-purple-200">{t.geminiApiKey}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {t.imageServiceUrl}:&nbsp;
                  <span className="text-gray-200">{backendUrl}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t.geminiApiKey}:&nbsp;
                  <span className="text-gray-200">
                    {apiKey ? 'Provided via VITE_GEMINI_API_KEY' : 'Not provided'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {language === 'zh'
                    ? '在项目根目录的 .env 文件中更新 VITE_API_BASE_URL 和 VITE_GEMINI_API_KEY 以修改这些设置。'
                    : 'Update the .env variables VITE_API_BASE_URL and VITE_GEMINI_API_KEY in the project root to change these values.'}
                </p>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};