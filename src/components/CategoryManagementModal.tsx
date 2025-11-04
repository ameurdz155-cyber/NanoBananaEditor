import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Plus, Edit2, Trash2, FolderTree, Smile } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createPortal } from 'react-dom';
import { 
  faFolder, faFolderOpen, faFile, faFileAlt, faFileImage, faFilePdf, faFileCode,
  faHome, faUser, faUsers, faCog, faChartBar, faChartLine, faChartPie,
  faHeart, faStar, faFlag, faBookmark, faBell, faEnvelope, faInbox,
  faCamera, faImage, faPalette, faBrush, faPaintBrush, faMusic, faVideo,
  faShoppingCart, faShoppingBag, faCreditCard, faTag, faGift, faStore,
  faBriefcase, faBuilding, faIndustry, faLandmark, faUniversity, faHospital,
  faGraduationCap, faBook, faBookOpen, faPen, faPencilAlt, faHighlighter,
  faPhone, faMobile, faTablet, faLaptop, faDesktop, faKeyboard, faMouse,
  faCoffee, faUtensils, faPizzaSlice, faBirthdayCake, faWineGlass, faCocktail,
  faCar, faBus, faTrain, faPlane, faRocket, faShip, faBicycle,
  faMapMarkedAlt, faMapPin, faGlobe, faCompass, faMap, faRoute,
  faClock, faCalendar, faCalendarAlt, faCalendarCheck, faStopwatch, faHourglass,
  faLightbulb, faBolt, faFire, faSnowflake, faSun, faMoon, faCloudSun,
  faTree, faLeaf, faSeedling, faMountain, faWater, faUmbrella,
  faDumbbell, faRunning, faSwimmer, faBiking, faFootballBall, faBasketballBall,
  faGamepad, faDice, faPuzzlePiece, faChess, faTrophy, faMedal, faAward,
  faLock, faUnlock, faKey, faShield, faUserShield, faFingerprint,
  faWrench, faTools, faScrewdriver, faHammer, faCogs, faCircle, faSquare
} from '@fortawesome/free-solid-svg-icons';

interface Category {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ open, onOpenChange }) => {
  const language = useAppStore((state) => state.language);
  const t = getTranslation(language);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('📁');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerTab, setEmojiPickerTab] = useState<'emoji' | 'icons' | 'upload'>('emoji');
  const [iconSearch, setIconSearch] = useState('');
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('promptCategories');
    if (stored) {
      try {
        setCategories(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load categories:', e);
      }
    } else {
      // Initialize with default categories
      const defaultCategories: Category[] = [
        { id: 'portrait', name: language === 'zh' ? '肖像' : 'Portrait', emoji: '🧑', createdAt: Date.now() },
        { id: 'landscape', name: language === 'zh' ? '风景' : 'Landscape', emoji: '🏞️', createdAt: Date.now() },
        { id: 'product', name: language === 'zh' ? '产品' : 'Product', emoji: '📦', createdAt: Date.now() },
        { id: 'art-style', name: language === 'zh' ? '艺术风格' : 'Art Style', emoji: '🎨', createdAt: Date.now() },
        { id: 'concept', name: language === 'zh' ? '概念设计' : 'Concept Design', emoji: '🌌', createdAt: Date.now() },
        { id: 'photography', name: language === 'zh' ? '摄影' : 'Photography', emoji: '📷', createdAt: Date.now() },
        { id: 'architecture', name: language === 'zh' ? '建筑设计' : 'Architecture', emoji: '🏛️', createdAt: Date.now() },
      ];
      setCategories(defaultCategories);
      localStorage.setItem('promptCategories', JSON.stringify(defaultCategories));
    }
  }, [open, language]);

  // Save categories to localStorage
  const saveCategories = (cats: Category[]) => {
    localStorage.setItem('promptCategories', JSON.stringify(cats));
    setCategories(cats);
  };

  // Open modal for create
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormEmoji('📁');
    setShowEditModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (category: Category) => {
    setEditingId(category.id);
    setFormName(category.name);
    setFormEmoji(category.emoji);
    setShowEditModal(true);
  };

  // Save (create or update)
  const handleSave = () => {
    if (!formName.trim()) return;
    
    if (editingId) {
      // Update existing
      const updated = categories.map(cat => 
        cat.id === editingId 
          ? { ...cat, name: formName.trim(), emoji: formEmoji }
          : cat
      );
      saveCategories(updated);
    } else {
      // Create new
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name: formName.trim(),
        emoji: formEmoji || '📁',
        createdAt: Date.now(),
      };
      const updated = [...categories, newCategory];
      saveCategories(updated);
    }
    
    setShowEditModal(false);
    setEditingId(null);
    setFormName('');
    setFormEmoji('📁');
  };

  // Cancel edit/create
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingId(null);
    setFormName('');
    setFormEmoji('📁');
    setShowEmojiPicker(false);
    setEmojiPickerTab('emoji');
    setIconSearch('');
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setFormEmoji(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle icon selection
  const handleIconSelect = (icon: string) => {
    setFormEmoji(icon);
    setShowEmojiPicker(false);
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormEmoji(result); // Store as data URL
        setShowEmojiPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Font Awesome icons list
  const fontAwesomeIcons = [
    // Files & Folders
    { icon: faFolder, name: 'folder' },
    { icon: faFolderOpen, name: 'folder-open' },
    { icon: faFile, name: 'file' },
    { icon: faFileAlt, name: 'file-alt' },
    { icon: faFileImage, name: 'file-image' },
    { icon: faFilePdf, name: 'file-pdf' },
    { icon: faFileCode, name: 'file-code' },
    // Home & Users
    { icon: faHome, name: 'home' },
    { icon: faUser, name: 'user' },
    { icon: faUsers, name: 'users' },
    { icon: faCog, name: 'cog' },
    // Charts & Analytics
    { icon: faChartBar, name: 'chart-bar' },
    { icon: faChartLine, name: 'chart-line' },
    { icon: faChartPie, name: 'chart-pie' },
    // Favorites & Bookmarks
    { icon: faHeart, name: 'heart' },
    { icon: faStar, name: 'star' },
    { icon: faFlag, name: 'flag' },
    { icon: faBookmark, name: 'bookmark' },
    { icon: faBell, name: 'bell' },
    { icon: faEnvelope, name: 'envelope' },
    { icon: faInbox, name: 'inbox' },
    // Creative & Media
    { icon: faCamera, name: 'camera' },
    { icon: faImage, name: 'image' },
    { icon: faPalette, name: 'palette' },
    { icon: faBrush, name: 'brush' },
    { icon: faPaintBrush, name: 'paint-brush' },
    { icon: faMusic, name: 'music' },
    { icon: faVideo, name: 'video' },
    // Shopping & Commerce
    { icon: faShoppingCart, name: 'shopping-cart' },
    { icon: faShoppingBag, name: 'shopping-bag' },
    { icon: faCreditCard, name: 'credit-card' },
    { icon: faTag, name: 'tag' },
    { icon: faGift, name: 'gift' },
    { icon: faStore, name: 'store' },
    // Business & Buildings
    { icon: faBriefcase, name: 'briefcase' },
    { icon: faBuilding, name: 'building' },
    { icon: faIndustry, name: 'industry' },
    { icon: faLandmark, name: 'landmark' },
    { icon: faUniversity, name: 'university' },
    { icon: faHospital, name: 'hospital' },
    // Education
    { icon: faGraduationCap, name: 'graduation-cap' },
    { icon: faBook, name: 'book' },
    { icon: faBookOpen, name: 'book-open' },
    { icon: faPen, name: 'pen' },
    { icon: faPencilAlt, name: 'pencil-alt' },
    { icon: faHighlighter, name: 'highlighter' },
    // Devices & Technology
    { icon: faPhone, name: 'phone' },
    { icon: faMobile, name: 'mobile' },
    { icon: faTablet, name: 'tablet' },
    { icon: faLaptop, name: 'laptop' },
    { icon: faDesktop, name: 'desktop' },
    { icon: faKeyboard, name: 'keyboard' },
    { icon: faMouse, name: 'mouse' },
    // Food & Drink
    { icon: faCoffee, name: 'coffee' },
    { icon: faUtensils, name: 'utensils' },
    { icon: faPizzaSlice, name: 'pizza-slice' },
    { icon: faBirthdayCake, name: 'birthday-cake' },
    { icon: faWineGlass, name: 'wine-glass' },
    { icon: faCocktail, name: 'cocktail' },
    // Transportation
    { icon: faCar, name: 'car' },
    { icon: faBus, name: 'bus' },
    { icon: faTrain, name: 'train' },
    { icon: faPlane, name: 'plane' },
    { icon: faRocket, name: 'rocket' },
    { icon: faShip, name: 'ship' },
    { icon: faBicycle, name: 'bicycle' },
    // Maps & Location
    { icon: faMapMarkedAlt, name: 'map-marked-alt' },
    { icon: faMapPin, name: 'map-pin' },
    { icon: faGlobe, name: 'globe' },
    { icon: faCompass, name: 'compass' },
    { icon: faMap, name: 'map' },
    { icon: faRoute, name: 'route' },
    // Time & Calendar
    { icon: faClock, name: 'clock' },
    { icon: faCalendar, name: 'calendar' },
    { icon: faCalendarAlt, name: 'calendar-alt' },
    { icon: faCalendarCheck, name: 'calendar-check' },
    { icon: faStopwatch, name: 'stopwatch' },
    { icon: faHourglass, name: 'hourglass' },
    // Weather & Nature
    { icon: faLightbulb, name: 'lightbulb' },
    { icon: faBolt, name: 'bolt' },
    { icon: faFire, name: 'fire' },
    { icon: faSnowflake, name: 'snowflake' },
    { icon: faSun, name: 'sun' },
    { icon: faMoon, name: 'moon' },
    { icon: faCloudSun, name: 'cloud-sun' },
    { icon: faTree, name: 'tree' },
    { icon: faLeaf, name: 'leaf' },
    { icon: faSeedling, name: 'seedling' },
    { icon: faMountain, name: 'mountain' },
    { icon: faWater, name: 'water' },
    { icon: faUmbrella, name: 'umbrella' },
    // Sports & Activities
    { icon: faDumbbell, name: 'dumbbell' },
    { icon: faRunning, name: 'running' },
    { icon: faSwimmer, name: 'swimmer' },
    { icon: faBiking, name: 'biking' },
    { icon: faFootballBall, name: 'football-ball' },
    { icon: faBasketballBall, name: 'basketball-ball' },
    // Gaming & Entertainment
    { icon: faGamepad, name: 'gamepad' },
    { icon: faDice, name: 'dice' },
    { icon: faPuzzlePiece, name: 'puzzle-piece' },
    { icon: faChess, name: 'chess' },
    { icon: faTrophy, name: 'trophy' },
    { icon: faMedal, name: 'medal' },
    { icon: faAward, name: 'award' },
    // Security
    { icon: faLock, name: 'lock' },
    { icon: faUnlock, name: 'unlock' },
    { icon: faKey, name: 'key' },
    { icon: faShield, name: 'shield' },
    { icon: faUserShield, name: 'user-shield' },
    { icon: faFingerprint, name: 'fingerprint' },
    // Tools & Settings
    { icon: faWrench, name: 'wrench' },
    { icon: faTools, name: 'tools' },
    { icon: faScrewdriver, name: 'screwdriver' },
    { icon: faHammer, name: 'hammer' },
    { icon: faCogs, name: 'cogs' },
    // Shapes
    { icon: faCircle, name: 'circle' },
    { icon: faSquare, name: 'square' },
  ];

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Handle paste for image upload
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!showEmojiPicker || emojiPickerTab !== 'upload') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result as string;
              setFormEmoji(result);
              setShowEmojiPicker(false);
            };
            reader.readAsDataURL(blob);
          }
          e.preventDefault();
          break;
        }
      }
    };

    if (showEmojiPicker && emojiPickerTab === 'upload') {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [showEmojiPicker, emojiPickerTab]);

  // Delete category
  const handleDelete = (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    
    const updated = categories.filter(cat => cat.id !== id);
    saveCategories(updated);
  };

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl w-[90vw] max-w-3xl h-[85vh] overflow-hidden z-[100] shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-gray-800/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-lime-600/20 rounded-lg">
                <FolderTree className="h-5 w-5 text-lime-400" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-100">
                  {t.menuPromptCategories}
                </Dialog.Title>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.manageCategories}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex flex-col h-[calc(100%-80px)]">
            
            {/* Search and Add Button */}
            <div className="px-6 py-4 border-b border-gray-700/30">
              <div className="flex gap-3">
                <Input
                  placeholder={t.searchPrompts}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleOpenCreate}
                  className="bg-lime-600 hover:bg-lime-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addCategory}
                </Button>
              </div>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <FolderTree className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">
                    {searchQuery ? t.noPromptsFound : 'No categories yet'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? t.tryDifferentSearch : 'Create your first category to organize templates'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="p-4 rounded-lg border bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {category.emoji.startsWith('data:image') ? (
                            <img src={category.emoji} alt={category.name} className="w-8 h-8 object-cover rounded" />
                          ) : category.emoji.startsWith('fa-') ? (
                            <FontAwesomeIcon 
                              icon={fontAwesomeIcons.find(i => `fa-${i.name}` === category.emoji)?.icon || faFolder} 
                              className="text-2xl text-lime-400" 
                            />
                          ) : (
                            <span className="text-2xl">{category.emoji}</span>
                          )}
                          <div>
                            <p className="text-gray-200 font-medium">{category.name}</p>
                            <p className="text-xs text-gray-500">
                              Created {new Date(category.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleOpenEdit(category)}
                            size="sm"
                            variant="ghost"
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(category.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-700/50 bg-gray-800/30">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  {filteredCategories.length} {language === 'zh' ? '个分类' : 'categories'}
                </p>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  className="text-gray-300 hover:text-gray-100"
                >
                  {t.ok}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Edit/Create Category Modal */}
      <Dialog.Root open={showEditModal} onOpenChange={(open) => {
        if (!open) handleCancelEdit();
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-lime-500/30 rounded-2xl shadow-2xl shadow-lime-500/20 w-full max-w-md z-[101]">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
                  {editingId ? (language === 'zh' ? '编辑分类' : 'Edit Category') : t.addCategory}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.categoryEmojiLabel}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 h-16 flex items-center justify-center border border-gray-700 rounded-lg bg-gray-800/40 text-3xl">
                      {formEmoji.startsWith('data:image') ? (
                        <img src={formEmoji} alt="Category icon" className="w-12 h-12 object-cover rounded" />
                      ) : formEmoji.startsWith('fa-') ? (
                        <FontAwesomeIcon 
                          icon={fontAwesomeIcons.find(i => `fa-${i.name}` === formEmoji)?.icon || faFolder} 
                          className="text-4xl text-lime-400" 
                        />
                      ) : (
                        <span>{formEmoji || '📁'}</span>
                      )}
                    </div>
                    <Button
                      ref={emojiButtonRef}
                      type="button"
                      onClick={() => {
                        const rect = emojiButtonRef.current?.getBoundingClientRect();
                        if (rect) {
                          // Calculate position to center the picker below the modal
                          const pickerWidth = 380;
                          const viewportWidth = window.innerWidth;
                          const viewportHeight = window.innerHeight;
                          
                          // Try to position it centered, but ensure it stays within viewport
                          let left = (viewportWidth - pickerWidth) / 2;
                          let top = rect.bottom + 8;
                          
                          // If picker would go off bottom of screen, position it above
                          if (top + 450 > viewportHeight) {
                            top = Math.max(50, rect.top - 450 - 8);
                          }
                          
                          setPickerPosition({ top, left });
                        }
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white h-16 px-4"
                    >
                      <Smile className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                  
                {/* Emoji Picker Popup with Tabs - Using Portal */}
                {showEmojiPicker && createPortal(
                  <div 
                    ref={emojiPickerRef}
                    className="fixed shadow-2xl rounded-lg overflow-hidden bg-gray-900 border border-gray-700"
                    style={{ 
                      top: `${pickerPosition.top}px`, 
                      left: `${pickerPosition.left}px`, 
                      width: '380px',
                      zIndex: 9999
                    }}
                  >
                      {/* Tabs */}
                      <div className="flex border-b border-gray-700 bg-gray-800">
                        <button
                          onClick={() => setEmojiPickerTab('emoji')}
                          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            emojiPickerTab === 'emoji'
                              ? 'bg-gray-900 text-lime-400 border-b-2 border-lime-400'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                          }`}
                        >
                          {language === 'zh' ? '表情' : 'Emoji'}
                        </button>
                        <button
                          onClick={() => setEmojiPickerTab('icons')}
                          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            emojiPickerTab === 'icons'
                              ? 'bg-gray-900 text-lime-400 border-b-2 border-lime-400'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                          }`}
                        >
                          {language === 'zh' ? '图标' : 'Icons'}
                        </button>
                        <button
                          onClick={() => setEmojiPickerTab('upload')}
                          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            emojiPickerTab === 'upload'
                              ? 'bg-gray-900 text-lime-400 border-b-2 border-lime-400'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                          }`}
                        >
                          {language === 'zh' ? '上传' : 'Upload'}
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="bg-gray-900">
                        {/* Emoji Tab */}
                        {emojiPickerTab === 'emoji' && (
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme={Theme.DARK}
                            width={380}
                            height={400}
                            searchPlaceHolder={language === 'zh' ? '搜索表情...' : 'Search emoji...'}
                            previewConfig={{ showPreview: false }}
                          />
                        )}

                        {/* Icons Tab */}
                        {emojiPickerTab === 'icons' && (
                          <div className="p-4" style={{ height: '400px', overflowY: 'auto' }}>
                            <Input
                              placeholder={language === 'zh' ? '搜索图标...' : 'Filter icons...'}
                              value={iconSearch}
                              onChange={(e) => setIconSearch(e.target.value)}
                              className="mb-3"
                            />
                            <div className="grid grid-cols-7 gap-2">
                              {fontAwesomeIcons
                                .filter(({ name }) => !iconSearch || name.toLowerCase().includes(iconSearch.toLowerCase()))
                                .map(({ icon, name }, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleIconSelect(`fa-${name}`)}
                                    className="w-12 h-12 flex items-center justify-center hover:bg-gray-800 rounded transition-colors border border-transparent hover:border-lime-400"
                                    title={name}
                                  >
                                    <FontAwesomeIcon icon={icon} className="text-xl text-gray-300" />
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Upload Tab */}
                        {emojiPickerTab === 'upload' && (
                          <div className="p-6 flex flex-col items-center justify-center" style={{ height: '400px' }}>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-gray-600 rounded-lg p-8 w-full cursor-pointer hover:border-lime-400 hover:bg-gray-800/50 transition-all text-center"
                            >
                              <div className="text-gray-400 mb-3">
                                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium text-gray-300 mb-1">
                                {language === 'zh' ? '上传图片' : 'Upload an image'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {language === 'zh' ? '或 Ctrl+V 粘贴图片或链接' : 'or Ctrl+V to paste an image or link'}
                              </p>
                            </div>
                            <div className="mt-4 flex gap-3">
                              <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-lime-600 hover:bg-lime-700 text-white"
                              >
                                {language === 'zh' ? '选择文件' : 'Choose File'}
                              </Button>
                              <Button
                                onClick={() => setShowEmojiPicker(false)}
                                variant="ghost"
                                className="text-gray-400 hover:text-gray-200"
                              >
                                {t.cancel}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>,
                  document.body
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t.categoryNameLabel}
                  </label>
                  <Input
                    placeholder={t.enterBoardName}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && formName.trim()) handleSave();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSave}
                  disabled={!formName.trim()}
                  className="flex-1 bg-lime-600 hover:bg-lime-700 text-white"
                >
                  {t.save}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  className="flex-1 text-gray-400 hover:text-gray-200"
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Dialog.Root>
  );
};
