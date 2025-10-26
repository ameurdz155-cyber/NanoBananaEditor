import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Save, Eye, EyeOff, Key, Sparkles, Shield, CheckCircle, AlertCircle, FlaskConical, Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { validateApiKey } from '../services/geminiService';
import { useAppStore } from '../store/useAppStore';
import { getTranslation, Language } from '../i18n/translations';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { language, setLanguage } = useAppStore();
  const t = getTranslation(language);
  
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setApiKey(''); // Ensure API key is empty by default
    }
  }, [open]);

  const handleTestKey = async () => {
    if (apiKey.trim()) {
      // Temporarily save the key for testing
      const previousKey = localStorage.getItem('gemini_api_key');
      localStorage.setItem('gemini_api_key', apiKey.trim());

      setIsValidating(true);
      setValidationStatus(null);

      try {
        const validation = await validateApiKey();
        setIsValidating(false);

        if (validation.valid) {
          setValidationStatus({ valid: true, message: t.apiKeyValid });
        } else {
          setValidationStatus({ valid: false, message: validation.error || t.apiKeyInvalid });
          // Restore previous key if test failed
          if (previousKey) {
            localStorage.setItem('gemini_api_key', previousKey);
          } else {
            localStorage.removeItem('gemini_api_key');
          }
        }
      } catch (error) {
        setIsValidating(false);
        setValidationStatus({ valid: false, message: t.apiKeyInvalid });
        // Restore previous key on error
        if (previousKey) {
          localStorage.setItem('gemini_api_key', previousKey);
        } else {
          localStorage.removeItem('gemini_api_key');
        }
      }
    } else {
      setValidationStatus({ valid: false, message: t.enterApiKeyToTest });
    }
  };

  const handleSave = async () => {
    if (apiKey.trim()) {
      // Save the key first
      localStorage.setItem('gemini_api_key', apiKey.trim());

      // Validate the API key
      setIsValidating(true);
      setValidationStatus(null);

      const validation = await validateApiKey();
      setIsValidating(false);

      if (validation.valid) {
        setValidationStatus({ valid: true, message: t.apiKeySaved });
        setIsSaved(true);
        setTimeout(() => {
          setIsSaved(false);
          onOpenChange(false);
        }, 1500);
      } else {
        setValidationStatus({ valid: false, message: validation.error || t.apiKeyInvalid });
      }
    }
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
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
              
              {/* API Key Section */}
              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                <div className="flex items-center mb-3">
                  <Shield className="h-4 w-4 text-purple-400 mr-2" />
                  <label htmlFor="api-key" className="text-sm font-medium text-purple-300">
                    {t.geminiApiKey}
                  </label>
                </div>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={t.enterApiKey}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                </div>
                {validationStatus && (
                  <div className={`mt-2 flex items-center text-xs ${
                    validationStatus.valid ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {validationStatus.valid ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {validationStatus.message}
                  </div>
                )}
                {isValidating && (
                  <div className="mt-2 flex items-center text-xs text-purple-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-400 mr-2" />
                    {t.validatingApiKey}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                {language === 'en' ? 'Get your API key from' : '从此处获取API密钥'}{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  {t.getApiKey}
                </a>
                </p>
              </div>

              <div className="mt-4">
                <Button
                  variant="secondary"
                  onClick={handleTestKey}
                  disabled={!apiKey.trim() || isValidating}
                  className="w-full"
                >
                  <FlaskConical className="h-4 w-4 mr-2" />
                  {isValidating ? t.testing : t.testApiKey}
                </Button>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-purple-500/20">
              <Button
                variant="secondary"
                onClick={handleClear}
                disabled={!apiKey}
              >
                {t.clear}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!apiKey.trim() || isValidating}
                className="min-w-[120px] btn-premium"
              >
                {isSaved ? (
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    {t.saved}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {t.save}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};