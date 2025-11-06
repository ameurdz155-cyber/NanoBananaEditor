'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Plus, Edit2, Trash2, Folder, Search, Upload,
} from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder, faFolderOpen, faFileImage, faHome, faHeart, faStar,
  faCamera, faPalette, faBriefcase, faBuilding, faBook, faPen,
  faCoffee, faCar, faClock, faLightbulb, faTrophy, faLock,
  faCircle, faSquare,
} from '@fortawesome/free-solid-svg-icons';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';

interface Category { id: string; name: string; emoji: string; createdAt: number; }

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
  const language = useAppStore(s => s.language);
  const t = getTranslation(language);
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('Folder');
  const [tab, setTab] = useState<'emoji' | 'icon' | 'upload'>('upload');
  const [iconQ, setIconQ] = useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = localStorage.getItem('promptCategories');
    if (s) setCats(JSON.parse(s));
    else {
      const d: Category[] = [
        { id: 'p', name: language === 'zh' ? '肖像' : 'Portrait', emoji: 'Person', createdAt: Date.now() },
        { id: 'l', name: language === 'zh' ? '风景' : 'Landscape', emoji: 'Landscape', createdAt: Date.now() },
        { id: 'r', name: language === 'zh' ? '产品' : 'Product', emoji: 'Package', createdAt: Date.now() },
        { id: 'a', name: language === 'zh' ? '艺术风格' : 'Art Style', emoji: 'Paintbrush', createdAt: Date.now() },
        { id: 'c', name: language === 'zh' ? '概念设计' : 'Concept Design', emoji: 'Galaxy', createdAt: Date.now() },
        { id: 'h', name: language === 'zh' ? '摄影' : 'Photography', emoji: 'Camera', createdAt: Date.now() },
        { id: 'b', name: language === 'zh' ? '建筑设计' : 'Architecture', emoji: 'Building', createdAt: Date.now() },
      ];
      setCats(d); localStorage.setItem('promptCategories', JSON.stringify(d));
    }
  }, [language]);

  const save = (list: Category[]) => { localStorage.setItem('promptCategories', JSON.stringify(list)); setCats(list); };
  const add = () => { setEdit(null); setName(''); setEmoji('Folder'); setOpen(true); };
  const editCat = (c: Category) => { setEdit(c); setName(c.name); setEmoji(c.emoji); setOpen(true); };
  const submit = () => {
    if (!name.trim()) return;
    if (edit) save(cats.map(c => c.id === edit.id ? { ...c, name, emoji } : c));
    else save([...cats, { id: Date.now().toString(), name, emoji, createdAt: Date.now() }]);
    setOpen(false);
  };
  const del = (id: string) => confirm(language === 'zh' ? '删除？' : 'Delete?') && save(cats.filter(c => c.id !== id));

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

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-lime-500/20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-300"><ArrowLeft className="h-5 w-5 mr-1" />{language === 'zh' ? '返回' : 'Back'}</Button>
              <div className="flex items-center gap-2"><Folder className="h-7 w-7 text-lime-400" /><h1 className="text-2xl font-bold bg-gradient-to-r from-lime-400 to-cyan-400 bg-clip-text text-transparent">{language === 'zh' ? '提示词分类' : 'Prompt Categories'}</h1></div>
            </div>
            <Button onClick={add} className="bg-gradient-to-r from-lime-600 to-cyan-600 hover:from-lime-700 hover:to-cyan-700"><Plus className="h-4 w-4 mr-1" />{t.addCategory}</Button>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input placeholder={t.searchPrompts || 'Search...'} value={q} onChange={e => setQ(e.target.value)} className="pl-10 bg-gray-800/60 border-gray-700" />
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20"><Folder className="h-20 w-20 text-gray-700 mx-auto mb-4 opacity-50" /><p className="text-gray-400">{q ? (language === 'zh' ? '未找到' : 'No results') : (language === 'zh' ? '暂无' : 'None yet')}</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(c => (
                <Card key={c.id} className="group p-5 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-lime-500/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {c.emoji.startsWith('data:') ? <img src={c.emoji} className="w-12 h-12 rounded-lg object-cover ring-2 ring-lime-500/30" /> :
                       c.emoji.startsWith('fa-') ? <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-lime-600/20 to-cyan-600/20 flex items-center justify-center ring-2 ring-lime-500/30"><FontAwesomeIcon icon={faIcons.find(i => `fa-${i.name}` === c.emoji)?.icon || faFolder} className="text-2xl text-lime-400" /></div> :
                       <div className="text-4xl">{c.emoji}</div>}
                      <div><h3 className="font-semibold text-white">{c.name}</h3><p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</p></div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => editCat(c)} className="h-8 w-8 text-cyan-400"><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del(c.id)} className="h-8 w-8 text-red-400"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
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
            <div><Label>Name</Label><Input placeholder="Category name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && submit()} autoFocus /></div>

            {/* Buttons */}
            <div className="flex gap-2"><Button onClick={submit} disabled={!name.trim()} className="flex-1 bg-gradient-to-r from-lime-600 to-cyan-600">{t.save || 'Save'}</Button><Button onClick={() => setOpen(false)} variant="outline" className="flex-1">{t.cancel || 'Cancel'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};