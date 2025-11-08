'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  ArrowLeft, Plus, Edit2, Trash2, Folder, Search, Upload, Mic, MicOff, Loader2,
} from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder, faFolderOpen, faFileImage, faHome, faHeart, faStar,
  faCamera, faPalette, faBriefcase, faBuilding, faBook, faPen,
  faCoffee, faCar, faClock, faLightbulb, faTrophy, faLock,
  faCircle, faSquare,
} from '@fortawesome/free-solid-svg-icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import { PromptCategory } from '../types';
import * as categoryService from '../services/categoryService';

const faIcons = [
  { icon: faFolder, name: 'folder' }, { icon: faFolderOpen, name: 'folder-open' },
  { icon: faFileImage, name: 'file-image' }, { icon: faHome, name: 'home' },
  { icon: faHeart, name: 'heart' }, { icon: faStar, name: 'star' },
  { icon: faCamera, name: 'camera' }, { icon: faPalette, name: 'palette' },
  { icon: faBriefcase, name: 'briefcase' }, { icon: faBuilding, name: 'building' },
  { icon: faBook, name: 'book' }, { icon: faPen, name: 'pen' },
  { icon: faCoffee, name: 'coffee' }, { icon: faCar, name: 'car' },
  { icon: faClock, name: 'clock' }, { icon: faLightbulb, name: 'lightbulb' },
  { icon: faTrophy, name: 'trophy' }, { icon: faLock, name: 'lock' },
  { icon: faCircle, name: 'circle' }, { icon: faSquare, name: 'square' },
];

export const CategoryManagementPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  console.log('[CategoryManagementPage] Component rendered');
  
  const language = useAppStore(s => s.language);
  const t = getTranslation(language);
  
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
  const [tab, setTab] = useState<'emoji' | 'icon' | 'upload'>('upload');
  const [iconQ, setIconQ] = useState('');
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
      if (edit) {
        // Update existing category on backend
        const updated = await categoryService.updateCategory(edit.id, { 
          name: name.trim(), 
          emoji 
        });
        updatePromptCategory(edit.id, updated);
      } else {
        // Create new category on backend
        const newCategory = await categoryService.createCategory({
          name: name.trim(),
          emoji,
        });
        addPromptCategory(newCategory);
      }
      
      setOpen(false);
      setName('');
      setEmoji('📁');
    } catch (err) {
      console.error('Failed to save category:', err);
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
  const filteredIcons = faIcons.filter(i => i.name.includes(iconQ.toLowerCase()));

  const onEmoji = (d: EmojiClickData) => setEmoji(d.emoji);
  const onFA = (n: string) => setEmoji(`fa-${n}`);
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

  return (
    <>
      <div className="h-full w-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-lime-500/20 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-300"><ArrowLeft className="h-5 w-5 mr-1" />{language === 'zh' ? '返回' : 'Back'}</Button>
              <div className="flex items-center gap-2"><Folder className="h-7 w-7 text-lime-400" /><h1 className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-cyan-400 bg-clip-text text-transparent">{language === 'zh' ? '提示词分类' : 'Prompt Categories'}</h1></div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 items-stretch">
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <Input
                ref={searchInputRef}
                placeholder={language === 'zh' ? '搜索...' : 'Search prompts...'}
                value={q}
                onChange={e => setQ(e.target.value)}
                className="pl-11 h-11 rounded-xl glass border border-purple-500/20 bg-gray-900/50 text-gray-100 placeholder:text-gray-400 focus-visible:border-purple-400/50 focus-visible:bg-gray-900/70 focus-visible:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-200"
              />
            </div>
            <Select value={voiceLang} onValueChange={handleVoiceLangChange}>
              <SelectTrigger className="h-11 w-auto min-w-[110px] bg-gray-900/80 border border-gray-700 text-xs text-gray-200 rounded-xl px-3">
                <SelectValue>{voiceLangLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-900 text-gray-100 border border-gray-700">
                <SelectItem value="en-US">English</SelectItem>
                <SelectItem value="zh-CN">中文</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={toggleVoiceSearch}
              disabled={!voiceSupported}
              className={`h-11 w-11 rounded-full border border-gray-700 bg-gray-900/80 flex-shrink-0 transition-colors ${listening && voiceSupported ? 'border-lime-500 text-lime-400 shadow-[0_0_12px_rgba(132,204,22,0.35)]' : 'text-gray-300 hover:border-gray-500 hover:text-white'} ${!voiceSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={voiceSupported ? (listening ? (language === 'zh' ? '停止语音搜索' : 'Stop voice search') : (language === 'zh' ? '开始语音搜索' : 'Start voice search')) : (language === 'zh' ? '浏览器不支持语音搜索' : 'Voice search not supported')}
            >
              {listening && voiceSupported ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button 
              onClick={add}
              size="icon"
              className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md border-0 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end))' }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

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
              <Loader2 className="h-12 w-12 text-lime-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">{language === 'zh' ? '加载中...' : 'Loading...'}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20"><Folder className="h-20 w-20 text-gray-700 mx-auto mb-4 opacity-50" /><p className="text-gray-400">{q ? (language === 'zh' ? '未找到' : 'No results') : (language === 'zh' ? '暂无' : 'None yet')}</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(c => {
                const displayEmoji = c.emoji || c.image || '📁';
                return (
                <Card key={c.id} className="group p-5 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-lime-500/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {displayEmoji.startsWith('data:') ? <img src={displayEmoji} alt={c.name} className="w-12 h-12 rounded-lg object-cover ring-2 ring-lime-500/30" /> :
                       displayEmoji.startsWith('fa-') ? <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-lime-600/20 to-cyan-600/20 flex items-center justify-center ring-2 ring-lime-500/30"><FontAwesomeIcon icon={faIcons.find(i => `fa-${i.name}` === displayEmoji)?.icon || faFolder} className="text-2xl text-lime-400" /></div> :
                       <div className="text-4xl">{displayEmoji}</div>}
                      <div><h3 className="font-semibold text-white">{c.name}</h3><p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</p></div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => editCat(c)} className="h-8 w-8 text-cyan-400"><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del(c.id)} className="h-8 w-8 text-red-400"><Trash2 className="h-4 w-4" /></Button>
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
        <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-850 border-lime-500/30 max-w-lg">
          <DialogHeader><DialogTitle className="bg-gradient-to-r from-lime-400 to-cyan-400 bg-clip-text text-transparent">{edit ? (language === 'zh' ? '编辑' : 'Edit') : t.addCategory}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            {/* Icon */}
            <div>
              <Label>Icon</Label>
              <div className="mt-2 flex gap-3 items-center">
                <Button variant="outline" size="lg" className="h-16 w-16 text-3xl">
                  {emoji.startsWith('data:') ? <img src={emoji} className="w-12 h-12 rounded" /> :
                   emoji.startsWith('fa-') ? <FontAwesomeIcon icon={faIcons.find(i => `fa-${i.name}` === emoji)?.icon || faFolder} className="text-3xl text-lime-400" /> :
                   emoji}
                </Button>
              </div>
              <Tabs value={tab} onValueChange={v => setTab(v as any)} className="mt-3">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger value="emoji">Emoji</TabsTrigger>
                  <TabsTrigger value="icon">Icons</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="emoji" className="bg-gray-900 rounded-b-lg border border-gray-700"><EmojiPicker onEmojiClick={onEmoji} theme={Theme.DARK} width="100%" height={320} /></TabsContent>
                <TabsContent value="icon" className="bg-gray-900 rounded-b-lg border border-gray-700 p-3" style={{ maxHeight: 320, overflowY: 'auto' }}>
                  <Input placeholder="Search..." value={iconQ} onChange={e => setIconQ(e.target.value)} className="mb-2" />
                  <div className="grid grid-cols-6 gap-2">
                    {filteredIcons.map(i => (
                      <button key={i.name} onClick={() => onFA(i.name)} className="h-11 w-11 flex items-center justify-center rounded bg-gray-800 hover:bg-lime-600/20 border border-gray-700">
                        <FontAwesomeIcon icon={i.icon} className="text-lg text-gray-300" />
                      </button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="bg-gray-900 rounded-b-lg border border-gray-700 p-6 text-center">
                  <input ref={fileRef} type="file" accept="image/*" onChange={onImg} className="hidden" />
                  <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-600 rounded-xl p-6 cursor-pointer hover:border-lime-500">
                    <Upload className="h-10 w-10 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm text-gray-300">Click to upload</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Name */}
            <div><Label>Name</Label><Input placeholder="Category name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && !isSaving && submit()} autoFocus /></div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={submit} 
                disabled={!name.trim() || isSaving} 
                className="flex-1 bg-gradient-to-r from-lime-600 to-cyan-600"
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
              <Button 
                onClick={() => { setOpen(false); setError(null); }} 
                variant="outline" 
                className="flex-1"
                disabled={isSaving}
              >
                {t.cancel || 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};