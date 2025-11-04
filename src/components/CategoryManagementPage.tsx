import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Plus, Edit2, Trash2, FolderTree, Smile, ArrowLeft, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
import { createPortal } from 'react-dom';

interface Category {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

interface CategoryManagementPageProps {
  onClose: () => void;
}

export const CategoryManagementPage: React.FC<CategoryManagementPageProps> = ({ onClose }) => {
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
  }, [language]);

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
          ? { ...cat, name: formName, emoji: formEmoji }
          : cat
      );
      saveCategories(updated);
    } else {
      // Create new
      const newCategory: Category = {
        id: Date.now().toString(),
        name: formName,
        emoji: formEmoji,
        createdAt: Date.now()
      };
      saveCategories([...categories, newCategory]);
    }

    handleCancelEdit();
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
        setFormEmoji(result);
        setShowEmojiPicker(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete category
  const handleDelete = (id: string) => {
    if (window.confirm(language === 'zh' ? '确定要删除这个分类吗？' : 'Are you sure you want to delete this category?')) {
      saveCategories(categories.filter(cat => cat.id !== id));
    }
  };

  // Font Awesome icons list
  const fontAwesomeIcons = [
    { icon: faFolder, name: 'folder' },
    { icon: faFolderOpen, name: 'folder-open' },
    { icon: faFile, name: 'file' },
    { icon: faFileAlt, name: 'file-alt' },
    { icon: faFileImage, name: 'file-image' },
    { icon: faFilePdf, name: 'file-pdf' },
    { icon: faFileCode, name: 'file-code' },
    { icon: faHome, name: 'home' },
    { icon: faUser, name: 'user' },
    { icon: faUsers, name: 'users' },
    { icon: faCog, name: 'cog' },
    { icon: faChartBar, name: 'chart-bar' },
    { icon: faChartLine, name: 'chart-line' },
    { icon: faChartPie, name: 'chart-pie' },
    { icon: faHeart, name: 'heart' },
    { icon: faStar, name: 'star' },
    { icon: faFlag, name: 'flag' },
    { icon: faBookmark, name: 'bookmark' },
    { icon: faBell, name: 'bell' },
    { icon: faEnvelope, name: 'envelope' },
    { icon: faInbox, name: 'inbox' },
    { icon: faCamera, name: 'camera' },
    { icon: faImage, name: 'image' },
    { icon: faPalette, name: 'palette' },
    { icon: faBrush, name: 'brush' },
    { icon: faPaintBrush, name: 'paint-brush' },
    { icon: faMusic, name: 'music' },
    { icon: faVideo, name: 'video' },
    { icon: faShoppingCart, name: 'shopping-cart' },
    { icon: faShoppingBag, name: 'shopping-bag' },
    { icon: faCreditCard, name: 'credit-card' },
    { icon: faTag, name: 'tag' },
    { icon: faGift, name: 'gift' },
    { icon: faStore, name: 'store' },
    { icon: faBriefcase, name: 'briefcase' },
    { icon: faBuilding, name: 'building' },
    { icon: faIndustry, name: 'industry' },
    { icon: faLandmark, name: 'landmark' },
    { icon: faUniversity, name: 'university' },
    { icon: faHospital, name: 'hospital' },
    { icon: faGraduationCap, name: 'graduation-cap' },
    { icon: faBook, name: 'book' },
    { icon: faBookOpen, name: 'book-open' },
    { icon: faPen, name: 'pen' },
    { icon: faPencilAlt, name: 'pencil-alt' },
    { icon: faHighlighter, name: 'highlighter' },
    { icon: faPhone, name: 'phone' },
    { icon: faMobile, name: 'mobile' },
    { icon: faTablet, name: 'tablet' },
    { icon: faLaptop, name: 'laptop' },
    { icon: faDesktop, name: 'desktop' },
    { icon: faKeyboard, name: 'keyboard' },
    { icon: faMouse, name: 'mouse' },
    { icon: faCoffee, name: 'coffee' },
    { icon: faUtensils, name: 'utensils' },
    { icon: faPizzaSlice, name: 'pizza-slice' },
    { icon: faBirthdayCake, name: 'birthday-cake' },
    { icon: faWineGlass, name: 'wine-glass' },
    { icon: faCocktail, name: 'cocktail' },
    { icon: faCar, name: 'car' },
    { icon: faBus, name: 'bus' },
    { icon: faTrain, name: 'train' },
    { icon: faPlane, name: 'plane' },
    { icon: faRocket, name: 'rocket' },
    { icon: faShip, name: 'ship' },
    { icon: faBicycle, name: 'bicycle' },
    { icon: faMapMarkedAlt, name: 'map-marked-alt' },
    { icon: faMapPin, name: 'map-pin' },
    { icon: faGlobe, name: 'globe' },
    { icon: faCompass, name: 'compass' },
    { icon: faMap, name: 'map' },
    { icon: faRoute, name: 'route' },
    { icon: faClock, name: 'clock' },
    { icon: faCalendar, name: 'calendar' },
    { icon: faCalendarAlt, name: 'calendar-alt' },
    { icon: faCalendarCheck, name: 'calendar-check' },
    { icon: faStopwatch, name: 'stopwatch' },
    { icon: faHourglass, name: 'hourglass' },
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
    { icon: faDumbbell, name: 'dumbbell' },
    { icon: faRunning, name: 'running' },
    { icon: faSwimmer, name: 'swimmer' },
    { icon: faBiking, name: 'biking' },
    { icon: faFootballBall, name: 'football-ball' },
    { icon: faBasketballBall, name: 'basketball-ball' },
    { icon: faGamepad, name: 'gamepad' },
    { icon: faDice, name: 'dice' },
    { icon: faPuzzlePiece, name: 'puzzle-piece' },
    { icon: faChess, name: 'chess' },
    { icon: faTrophy, name: 'trophy' },
    { icon: faMedal, name: 'medal' },
    { icon: faAward, name: 'award' },
    { icon: faLock, name: 'lock' },
    { icon: faUnlock, name: 'unlock' },
    { icon: faKey, name: 'key' },
    { icon: faShield, name: 'shield' },
    { icon: faUserShield, name: 'user-shield' },
    { icon: faFingerprint, name: 'fingerprint' },
    { icon: faWrench, name: 'wrench' },
    { icon: faTools, name: 'tools' },
    { icon: faScrewdriver, name: 'screwdriver' },
    { icon: faHammer, name: 'hammer' },
    { icon: faCogs, name: 'cogs' },
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

  // Filter categories
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {language === 'zh' ? '返回' : 'Back'}
              </Button>
              <div className="flex items-center gap-3">
                <FolderTree className="h-6 w-6 text-lime-400" />
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
                  {language === 'zh' ? '提示词分类' : 'Prompt Categories'}
                </h1>
              </div>
            </div>
            <Button
              onClick={handleOpenCreate}
              className="bg-lime-600 hover:bg-lime-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.addCategory}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder={t.searchPrompts}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <FolderTree className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {searchQuery
                ? (language === 'zh' ? '未找到匹配的分类' : 'No categories found')
                : (language === 'zh' ? '还没有分类' : 'No categories yet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="p-6 rounded-lg border bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 transition-all hover:border-lime-400/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {category.emoji.startsWith('data:image') ? (
                      <img src={category.emoji} alt={category.name} className="w-12 h-12 object-cover rounded" />
                    ) : category.emoji.startsWith('fa-') ? (
                      <FontAwesomeIcon 
                        icon={fontAwesomeIcons.find(i => `fa-${i.name}` === category.emoji)?.icon || faFolder} 
                        className="text-3xl text-lime-400" 
                      />
                    ) : (
                      <span className="text-3xl">{category.emoji}</span>
                    )}
                    <div>
                      <p className="text-gray-200 font-medium text-lg">{category.name}</p>
                      <p className="text-xs text-gray-500">
                        {language === 'zh' ? '创建于' : 'Created'} {new Date(category.createdAt).toLocaleDateString()}
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

      {/* Edit/Create Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-lime-500/30 rounded-2xl shadow-2xl shadow-lime-500/20 w-full max-w-md">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
                  {editingId ? (language === 'zh' ? '编辑分类' : 'Edit Category') : t.addCategory}
                </h2>
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                >
                  <X className="h-5 w-5" />
                </Button>
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
                          const pickerWidth = 380;
                          const viewportWidth = window.innerWidth;
                          const viewportHeight = window.innerHeight;
                          
                          let left = (viewportWidth - pickerWidth) / 2;
                          let top = rect.bottom + 8;
                          
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
          </div>
        </div>
      )}
    </div>
  );
};
