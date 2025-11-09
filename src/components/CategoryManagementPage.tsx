'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Card } from './ui/card';
import {
  ArrowLeft, Edit2, Trash2, Folder, Upload, Loader2,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder,
} from '@fortawesome/free-solid-svg-icons';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { PromptCategory } from '../types';
import * as categoryService from '../services/categoryService';
import { cn } from '../utils/cn';
import { CategoryManagementToolbar, VoiceLanguageOption } from './CategoryManagementToolbar';

export const CategoryManagementPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  console.log('[CategoryManagementPage] Component rendered');
  
  const language = useAppStore(s => s.language);
  const t = getTranslation(language);
  
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
  
  // Use Zustand store for categories
  const cats = useAppStore(s => s.promptCategories);
  const setPromptCategories = useAppStore(s => s.setPromptCategories);
  const addPromptCategory = useAppStore(s => s.addPromptCategory);
  const updatePromptCategory = useAppStore(s => s.updatePromptCategory);
  const deletePromptCategory = useAppStore(s => s.deletePromptCategory);
  
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<PromptCategory | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'zh-CN'>(() => (language === 'zh' ? 'zh-CN' : 'en-US'));
  const voiceLangWasManuallyChanged = React.useRef(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const recognitionRef = React.useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize browser speech recognition once the component mounts.
  useEffect(() => {
    const SpeechRecognitionCtor = typeof window !== 'undefined'
      ? ((window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition
        || (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition)
      : undefined;

    if (!SpeechRecognitionCtor) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = voiceLang;
    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) {
        setQ(transcript);
        searchInputRef.current?.focus();
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort?.();
        } catch (error) {
          console.warn('Failed to stop speech recognition', error);
        }
      }
      recognitionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = voiceLang;
  }, [voiceLang]);

  useEffect(() => {
    const defaultVoiceLang = language === 'zh' ? 'zh-CN' : 'en-US';
    if (!voiceLangWasManuallyChanged.current) {
      setVoiceLang(defaultVoiceLang);
    } else if (voiceLang === defaultVoiceLang) {
      voiceLangWasManuallyChanged.current = false;
    }
  }, [language, voiceLang]);

  // Load categories from backend on mount
  useEffect(() => {
    console.log('[CategoryManagement] useEffect triggered');
    
    const loadCategories = async () => {
      console.log('[CategoryManagement] Loading categories from backend...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      console.log('[CategoryManagement] Auth token exists:', !!token);
      console.log('[CategoryManagement] Token value:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        console.warn('[CategoryManagement] No auth token found - user needs to login');
        setError(language === 'zh' ? '请先登录以管理分类' : 'Please login to manage categories');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        console.log('[CategoryManagement] Calling categoryService.fetchCategories()...');
        const categories = await categoryService.fetchCategories();
        console.log('[CategoryManagement] Loaded categories:', categories);
        setPromptCategories(categories);
      } catch (err) {
        console.error('[CategoryManagement] Failed to load categories:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
        setError(errorMessage);
        
        // If 403, it means authentication failed
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          setError(language === 'zh' ? '认证失败，请重新登录' : 'Authentication failed, please login again');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, [setPromptCategories, language]);

  const add = () => { 
    setEdit(null); 
    setName(''); 
    setEmoji('📁'); 
    setOpen(true); 
  };
  
  const editCat = (c: PromptCategory) => { 
    setEdit(c); 
    setName(c.name); 
    setEmoji(c.emoji || '📁'); 
    setOpen(true); 
  };
  
  const submit = async () => {
    if (!name.trim() || isSaving) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Determine if emoji is a base64 image or an actual emoji
      const isImage = emoji.startsWith('data:');
      const payload: any = {
        name: name.trim(),
      };
      
      if (isImage) {
        payload.image = emoji;
        payload.emoji = null; // Explicitly clear emoji when using image
      } else {
        payload.emoji = emoji;
        payload.image = null; // Explicitly clear image when using emoji
      }
      
      console.log('[CategoryManagement] Submitting payload:', { 
        name: payload.name,
        emoji: payload.emoji,
        image: payload.image ? `${payload.image.substring(0, 50)}...` : null,
        isImage
      });
      
      if (edit) {
        // Update existing category on backend
        console.log('[CategoryManagement] Updating category:', edit.id);
        const updated = await categoryService.updateCategory(edit.id, payload);
        console.log('[CategoryManagement] Update response:', updated);
        
        // Update in Zustand store with the complete updated category from backend
        updatePromptCategory(edit.id, {
          name: updated.name,
          description: updated.description,
          emoji: updated.emoji,
          image: updated.image,
          isDefault: updated.isDefault,
          updatedAt: updated.updatedAt,
        });
      } else {
        // Create new category on backend
        console.log('[CategoryManagement] Creating new category');
        const newCategory = await categoryService.createCategory(payload);
        console.log('[CategoryManagement] Create response:', newCategory);
        addPromptCategory(newCategory);
      }
      
      setOpen(false);
      setName('');
      setEmoji('📁');
    } catch (err) {
      console.error('[CategoryManagement] Failed to save category:', err);
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };
  
  const del = async (id: string) => {
    if (!confirm(language === 'zh' ? '确定删除此分类？' : 'Delete this category?')) {
      return;
    }
    
    setError(null);
    try {
      await categoryService.deleteCategory(id);
      deletePromptCategory(id);
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const filtered = cats.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  const onImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = ev => setEmoji(ev.target?.result as string);
      r.readAsDataURL(f);
    }
  };

  const startVoiceSearch = () => {
    if (!voiceSupported) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.lang = voiceLang;
      recognition.start();
      setListening(true);
    } catch (error) {
      console.error('Unable to start speech recognition', error);
      setListening(false);
    }
  };

  const stopVoiceSearch = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
      recognition.abort?.();
    } catch (error) {
      console.warn('Unable to stop speech recognition', error);
    } finally {
      setListening(false);
    }
  };

  const toggleVoiceSearch = () => {
    if (!voiceSupported) return;
    if (listening) stopVoiceSearch();
    else startVoiceSearch();
  };

  const handleVoiceLangChange = (value: string) => {
    if (value !== 'en-US' && value !== 'zh-CN') return;
    const defaultVoiceLang = language === 'zh' ? 'zh-CN' : 'en-US';
    voiceLangWasManuallyChanged.current = value !== defaultVoiceLang;
    setVoiceLang(value);
  };

  const voiceLangLabel = voiceLang === 'zh-CN' ? '中文' : 'English';
  const voiceLanguageOptions = React.useMemo<VoiceLanguageOption[]>(() => [
    { value: 'en-US', label: language === 'zh' ? '英语' : 'English' },
    { value: 'zh-CN', label: language === 'zh' ? '中文' : '中文' },
  ], [language]);

  const voiceButtonTitle = voiceSupported
    ? (listening
      ? (language === 'zh' ? '停止语音搜索' : 'Stop voice search')
      : (language === 'zh' ? '开始语音搜索' : 'Start voice search'))
    : (language === 'zh' ? '浏览器不支持语音搜索' : 'Voice search not supported');

  const addButtonAriaLabel = language === 'zh' ? '新增分类' : 'Add category';
  const searchPlaceholder = language === 'zh' ? '搜索...' : 'Search prompts...';

  return (
    <>
      <div className="h-full w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-y-auto">
        {/* Header */}
  <div className="sticky top-0 bg-gray-900 backdrop-blur-xl border-b border-vis-border z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button onClick={onClose} variant="ghost" size="sm" className="text-vis-text-secondary hover:text-vis-teal-300"><ArrowLeft className="h-5 w-5 mr-1" />{language === 'zh' ? '返回' : 'Back'}</Button>
              <div className="flex items-center gap-2"><Folder className="h-7 w-7 text-vis-teal-400" /><h1 className="text-2xl font-bold bg-gradient-to-r from-vis-teal-400 to-vis-cyan-400 bg-clip-text text-transparent">{language === 'zh' ? '提示词分类' : 'Prompt Categories'}</h1></div>
            </div>
          </div>
        </div>

        {/* Search */}
        <CategoryManagementToolbar
          searchValue={q}
          onSearchChange={value => setQ(value)}
          searchPlaceholder={searchPlaceholder}
          searchInputRef={searchInputRef}
          voiceLang={voiceLang}
          onVoiceLangChange={handleVoiceLangChange}
          voiceLangLabel={voiceLangLabel}
          voiceLanguageOptions={voiceLanguageOptions}
          voiceSupported={voiceSupported}
          listening={listening}
          voiceButtonTitle={voiceButtonTitle}
          addButtonAriaLabel={addButtonAriaLabel}
          onToggleVoiceSearch={toggleVoiceSearch}
          onAddCategory={add}
        />

        {/* Error Display */}
        {error && (
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
              {error}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="h-12 w-12 text-vis-teal-400 mx-auto mb-4 animate-spin" />
              <p className="text-vis-text-secondary">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20"><Folder className="h-20 w-20 text-vis-text-muted mx-auto mb-4 opacity-50" /><p className="text-vis-text-secondary">{q ? (language === 'zh' ? '未找到' : 'No results') : (language === 'zh' ? '暂无' : 'None yet')}</p></div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(c => {
                const displayEmoji = c.emoji || c.image || '📁';
                return (
                <Card key={c.id} className="group p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-vis-border hover:border-vis-teal-400 hover:shadow-vis-glow-teal transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {displayEmoji.startsWith('data:') ? (
                        <img src={displayEmoji} alt={c.name} className="w-12 h-12 rounded-lg object-cover ring-2 ring-vis-teal-400/30 flex-shrink-0" />
                      ) : (
                        <div className="text-3xl flex-shrink-0">{displayEmoji}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-vis-text-primary truncate">{c.name}</h3>
                        <p className="text-xs text-vis-text-muted">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4">
                      <Button size="icon" variant="ghost" onClick={() => editCat(c)} className="h-8 w-8 text-vis-cyan-400 hover:text-vis-cyan-300 hover:bg-vis-cyan-500/10"><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del(c.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </Card>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Modal with inline picker */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className={cn(
              "text-xl font-bold",
              isDarkMode 
                ? "text-transparent bg-clip-text bg-gradient-to-r from-vis-teal-400 to-vis-cyan-400"
                : "text-purple-600"
            )}>
              {edit 
                ? (language === 'zh' ? '编辑分类' : 'Edit Category')
                : (language === 'zh' ? '创建分类' : 'Create Category')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid gap-4">
              {/* Name */}
              <div className="grid gap-2">
                <label className={cn(
                  "text-sm font-medium",
                  isDarkMode ? "text-vis-text-secondary" : "text-gray-700"
                )}>{language === 'zh' ? '名称' : 'Name'}</label>
                <Input 
                  placeholder={language === 'zh' ? '分类名称' : 'Category name'} 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && name.trim() && !isSaving && submit()} 
                  autoFocus 
                  className={cn(
                    "transition-all duration-200",
                    isDarkMode
                      ? "bg-gray-900/50 border-vis-border text-vis-text-primary placeholder:text-vis-text-muted focus-visible:border-vis-teal-400 focus-visible:bg-gray-900/70 focus-visible:shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                      : "bg-white border-purple-200/60 text-gray-800 placeholder:text-gray-400 focus-visible:border-purple-400 focus-visible:bg-purple-50/50 focus-visible:shadow-[0_0_18px_rgba(168,85,247,0.12)]"
                  )}
                />
              </div>

              {/* Icon Upload */}
              <div className="grid gap-2">
                <label className={cn(
                  "text-sm font-medium",
                  isDarkMode ? "text-vis-text-secondary" : "text-gray-700"
                )}>{language === 'zh' ? '图标' : 'Icon'}</label>
                <input 
                  ref={fileRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={onImg} 
                  className="hidden" 
                />
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full flex items-center justify-center gap-2 transition-colors",
                    isDarkMode
                      ? "border-vis-border hover:border-vis-teal-400 hover:bg-vis-teal-500/10"
                      : "border-purple-200/60 hover:border-purple-400 hover:bg-purple-50"
                  )}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-5 w-5" />
                  <span>{language === 'zh' ? '上传图标' : 'Upload Icon'}</span>
                </Button>
                {emoji && emoji !== '📁' && (
                  <div className="mt-2 flex items-center gap-4">
                    <div className={cn(
                      "h-20 w-20 rounded-md border flex items-center justify-center",
                      isDarkMode 
                        ? "border-vis-border bg-gray-800/50" 
                        : "border-purple-200/60 bg-purple-50/50"
                    )}>
                      {emoji.startsWith('data:') ? (
                        <img src={emoji} alt="Icon preview" className="h-full w-full rounded-md object-cover" />
                      ) : (
                        <span className="text-3xl">{emoji}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-sm transition-colors",
                        isDarkMode
                          ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          : "text-red-600 hover:text-red-700 hover:bg-red-100"
                      )}
                      type="button"
                      onClick={() => setEmoji('📁')}
                    >
                      {language === 'zh' ? '清除' : 'Clear'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className={cn(
                  "rounded-lg p-3 text-sm",
                  isDarkMode
                    ? "bg-red-500/10 border border-red-500/30 text-red-400"
                    : "bg-red-50 border border-red-200 text-red-700"
                )}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className={cn(
            "flex justify-end gap-3 pt-4 border-t flex-shrink-0",
            isDarkMode ? "border-vis-border" : "border-purple-200/40"
          )}>
            <Button 
              onClick={() => { setOpen(false); setError(null); }} 
              variant="ghost"
              disabled={isSaving}
              className={cn(
                "transition-colors",
                isDarkMode 
                  ? "hover:bg-gray-800/50 text-vis-text-secondary hover:text-vis-text-primary" 
                  : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              )}
            >
              {t.cancel || 'Cancel'}
            </Button>
            <Button 
              onClick={submit} 
              disabled={!name.trim() || isSaving}
              className={cn(
                "text-white shadow-lg transition-all duration-200",
                isDarkMode
                  ? "bg-gradient-to-r from-vis-teal-500 to-vis-cyan-500 hover:from-vis-teal-400 hover:to-vis-cyan-400 shadow-vis-glow-teal hover:shadow-vis-glow-cyan"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/30 hover:shadow-purple-500/50"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'zh' ? '保存中...' : 'Saving...'}
                </>
              ) : (
                t.save || 'Save'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};