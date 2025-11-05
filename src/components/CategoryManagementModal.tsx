import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { CSSProperties } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, Plus, Edit2, Trash2, FolderTree, Smile } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getTranslation } from '../i18n/translations';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { 
  FaFolder, FaFolderOpen, FaFile, FaFileAlt, FaFileImage, FaFilePdf, FaFileCode,
  FaHome, FaUser, FaUsers, FaCog, FaChartBar, FaChartLine, FaChartPie,
  FaHeart, FaStar, FaFlag, FaBookmark, FaBell, FaEnvelope, FaInbox,
  FaCamera, FaImage, FaPalette, FaBrush, FaPaintBrush, FaMusic, FaVideo,
  FaShoppingCart, FaShoppingBag, FaCreditCard, FaTag, FaGift, FaStore,
  FaBriefcase, FaBuilding, FaIndustry, FaLandmark, FaUniversity, FaHospital,
  FaGraduationCap, FaBook, FaBookOpen, FaPen, FaPencilAlt, FaHighlighter,
  FaPhone, FaMobile, FaTablet, FaLaptop, FaDesktop, FaKeyboard, FaMouse,
  FaCoffee, FaUtensils, FaPizzaSlice, FaBirthdayCake, FaWineGlass, FaCocktail,
  FaCar, FaBus, FaTrain, FaPlane, FaRocket, FaShip, FaBicycle,
  FaMapMarkedAlt, FaMapPin, FaGlobe, FaCompass, FaMap, FaRoute,
  FaClock, FaCalendar, FaCalendarAlt, FaCalendarCheck, FaStopwatch, FaHourglass,
  FaLightbulb, FaBolt, FaFire, FaSnowflake, FaSun, FaMoon, FaCloudSun,
  FaTree, FaLeaf, FaSeedling, FaMountain, FaWater, FaUmbrella,
  FaDumbbell, FaRunning, FaSwimmer, FaBiking, FaFootballBall, FaBasketballBall,
  FaGamepad, FaDice, FaPuzzlePiece, FaChess, FaTrophy, FaMedal, FaAward,
  FaLock, FaUnlock, FaKey, FaUserShield, FaFingerprint,
  FaWrench, FaTools, FaScrewdriver, FaHammer, FaCogs, FaCircle, FaSquare
} from 'react-icons/fa';

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      return savedTheme !== 'light';
    }
    return document.documentElement.classList.contains('dark');
  });
  const emojiPickerThemeStyles = useMemo<Record<string, string>>(() => {
    if (isDarkMode) {
      return {
        '--epr-bg-color': 'var(--surface-primary)',
        '--epr-panel-bg-color': 'var(--surface-secondary)',
        '--epr-text-color': 'var(--text-primary)',
        '--epr-category-label-color': 'var(--text-secondary)',
        '--epr-hover-bg-color': 'rgba(124, 58, 237, 0.16)',
        '--epr-border-color': 'var(--surface-border)',
        '--epr-search-border-color': 'var(--surface-border)',
        '--epr-search-placeholder-color': 'var(--text-tertiary)',
        '--epr-search-bg-color': 'rgba(40, 42, 60, 0.9)',
        '--epr-highlight-color': 'var(--accent-emerald)'
      };
    }

    return {
      '--epr-bg-color': 'rgba(255, 255, 255, 0.98)',
      '--epr-panel-bg-color': 'rgba(244, 246, 253, 0.96)',
      '--epr-text-color': 'var(--text-primary)',
      '--epr-category-label-color': 'var(--text-secondary)',
      '--epr-hover-bg-color': 'rgba(124, 58, 237, 0.08)',
      '--epr-border-color': 'var(--surface-border)',
      '--epr-search-border-color': 'var(--surface-border)',
      '--epr-search-placeholder-color': 'var(--text-tertiary)',
      '--epr-search-bg-color': 'rgba(255, 255, 255, 0.95)',
      '--epr-highlight-color': 'var(--accent-emerald)'
    };
  }, [isDarkMode]);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, [open, showEditModal]);

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

  // Font Awesome icons list using react-icons
  const fontAwesomeIcons = [
    // Files & Folders
    { id: 'folder', name: 'Folder', icon: FaFolder },
    { id: 'folder-open', name: 'Folder Open', icon: FaFolderOpen },
    { id: 'file', name: 'File', icon: FaFile },
    { id: 'file-alt', name: 'File Alt', icon: FaFileAlt },
    { id: 'file-image', name: 'File Image', icon: FaFileImage },
    { id: 'file-pdf', name: 'File PDF', icon: FaFilePdf },
    { id: 'file-code', name: 'File Code', icon: FaFileCode },
    // Home & Users
    { id: 'home', name: 'Home', icon: FaHome },
    { id: 'user', name: 'User', icon: FaUser },
    { id: 'users', name: 'Users', icon: FaUsers },
    { id: 'cog', name: 'Cog', icon: FaCog },
    // Charts & Analytics
    { id: 'chart-bar', name: 'Chart Bar', icon: FaChartBar },
    { id: 'chart-line', name: 'Chart Line', icon: FaChartLine },
    { id: 'chart-pie', name: 'Chart Pie', icon: FaChartPie },
    // Favorites & Bookmarks
    { id: 'heart', name: 'Heart', icon: FaHeart },
    { id: 'star', name: 'Star', icon: FaStar },
    { id: 'flag', name: 'Flag', icon: FaFlag },
    { id: 'bookmark', name: 'Bookmark', icon: FaBookmark },
    { id: 'bell', name: 'Bell', icon: FaBell },
    { id: 'envelope', name: 'Envelope', icon: FaEnvelope },
    { id: 'inbox', name: 'Inbox', icon: FaInbox },
    // Creative & Media
    { id: 'camera', name: 'Camera', icon: FaCamera },
    { id: 'image', name: 'Image', icon: FaImage },
    { id: 'palette', name: 'Palette', icon: FaPalette },
    { id: 'brush', name: 'Brush', icon: FaBrush },
    { id: 'paint-brush', name: 'Paint Brush', icon: FaPaintBrush },
    { id: 'music', name: 'Music', icon: FaMusic },
    { id: 'video', name: 'Video', icon: FaVideo },
    // Shopping & Commerce
    { id: 'shopping-cart', name: 'Shopping Cart', icon: FaShoppingCart },
    { id: 'shopping-bag', name: 'Shopping Bag', icon: FaShoppingBag },
    { id: 'credit-card', name: 'Credit Card', icon: FaCreditCard },
    { id: 'tag', name: 'Tag', icon: FaTag },
    { id: 'gift', name: 'Gift', icon: FaGift },
    { id: 'store', name: 'Store', icon: FaStore },
    // Business & Buildings
    { id: 'briefcase', name: 'Briefcase', icon: FaBriefcase },
    { id: 'building', name: 'Building', icon: FaBuilding },
    { id: 'industry', name: 'Industry', icon: FaIndustry },
    { id: 'landmark', name: 'Landmark', icon: FaLandmark },
    { id: 'university', name: 'University', icon: FaUniversity },
    { id: 'hospital', name: 'Hospital', icon: FaHospital },
    // Education
    { id: 'graduation-cap', name: 'Graduation Cap', icon: FaGraduationCap },
    { id: 'book', name: 'Book', icon: FaBook },
    { id: 'book-open', name: 'Book Open', icon: FaBookOpen },
    { id: 'pen', name: 'Pen', icon: FaPen },
    { id: 'pencil-alt', name: 'Pencil Alt', icon: FaPencilAlt },
    { id: 'highlighter', name: 'Highlighter', icon: FaHighlighter },
    // Devices & Technology
    { id: 'phone', name: 'Phone', icon: FaPhone },
    { id: 'mobile', name: 'Mobile', icon: FaMobile },
    { id: 'tablet', name: 'Tablet', icon: FaTablet },
    { id: 'laptop', name: 'Laptop', icon: FaLaptop },
    { id: 'desktop', name: 'Desktop', icon: FaDesktop },
    { id: 'keyboard', name: 'Keyboard', icon: FaKeyboard },
    { id: 'mouse', name: 'Mouse', icon: FaMouse },
    // Food & Drink
    { id: 'coffee', name: 'Coffee', icon: FaCoffee },
    { id: 'utensils', name: 'Utensils', icon: FaUtensils },
    { id: 'pizza-slice', name: 'Pizza Slice', icon: FaPizzaSlice },
    { id: 'birthday-cake', name: 'Birthday Cake', icon: FaBirthdayCake },
    { id: 'wine-glass', name: 'Wine Glass', icon: FaWineGlass },
    { id: 'cocktail', name: 'Cocktail', icon: FaCocktail },
    // Transportation
    { id: 'car', name: 'Car', icon: FaCar },
    { id: 'bus', name: 'Bus', icon: FaBus },
    { id: 'train', name: 'Train', icon: FaTrain },
    { id: 'plane', name: 'Plane', icon: FaPlane },
    { id: 'rocket', name: 'Rocket', icon: FaRocket },
    { id: 'ship', name: 'Ship', icon: FaShip },
    { id: 'bicycle', name: 'Bicycle', icon: FaBicycle },
    // Maps & Location
    { id: 'map-marked-alt', name: 'Map Marked', icon: FaMapMarkedAlt },
    { id: 'map-pin', name: 'Map Pin', icon: FaMapPin },
    { id: 'globe', name: 'Globe', icon: FaGlobe },
    { id: 'compass', name: 'Compass', icon: FaCompass },
    { id: 'map', name: 'Map', icon: FaMap },
    { id: 'route', name: 'Route', icon: FaRoute },
    // Time & Calendar
    { id: 'clock', name: 'Clock', icon: FaClock },
    { id: 'calendar', name: 'Calendar', icon: FaCalendar },
    { id: 'calendar-alt', name: 'Calendar Alt', icon: FaCalendarAlt },
    { id: 'calendar-check', name: 'Calendar Check', icon: FaCalendarCheck },
    { id: 'stopwatch', name: 'Stopwatch', icon: FaStopwatch },
    { id: 'hourglass', name: 'Hourglass', icon: FaHourglass },
    // Weather & Nature
    { id: 'lightbulb', name: 'Lightbulb', icon: FaLightbulb },
    { id: 'bolt', name: 'Bolt', icon: FaBolt },
    { id: 'fire', name: 'Fire', icon: FaFire },
    { id: 'snowflake', name: 'Snowflake', icon: FaSnowflake },
    { id: 'sun', name: 'Sun', icon: FaSun },
    { id: 'moon', name: 'Moon', icon: FaMoon },
    { id: 'cloud-sun', name: 'Cloud Sun', icon: FaCloudSun },
    { id: 'tree', name: 'Tree', icon: FaTree },
    { id: 'leaf', name: 'Leaf', icon: FaLeaf },
    { id: 'seedling', name: 'Seedling', icon: FaSeedling },
    { id: 'mountain', name: 'Mountain', icon: FaMountain },
    { id: 'water', name: 'Water', icon: FaWater },
    { id: 'umbrella', name: 'Umbrella', icon: FaUmbrella },
    // Sports & Activities
    { id: 'dumbbell', name: 'Dumbbell', icon: FaDumbbell },
    { id: 'running', name: 'Running', icon: FaRunning },
    { id: 'swimmer', name: 'Swimmer', icon: FaSwimmer },
    { id: 'biking', name: 'Biking', icon: FaBiking },
    { id: 'football-ball', name: 'Football Ball', icon: FaFootballBall },
    { id: 'basketball-ball', name: 'Basketball Ball', icon: FaBasketballBall },
    // Gaming & Entertainment
    { id: 'gamepad', name: 'Gamepad', icon: FaGamepad },
    { id: 'dice', name: 'Dice', icon: FaDice },
    { id: 'puzzle-piece', name: 'Puzzle Piece', icon: FaPuzzlePiece },
    { id: 'chess', name: 'Chess', icon: FaChess },
    { id: 'trophy', name: 'Trophy', icon: FaTrophy },
    { id: 'medal', name: 'Medal', icon: FaMedal },
    { id: 'award', name: 'Award', icon: FaAward },
    // Security
    { id: 'lock', name: 'Lock', icon: FaLock },
    { id: 'unlock', name: 'Unlock', icon: FaUnlock },
    { id: 'key', name: 'Key', icon: FaKey },
    { id: 'user-shield', name: 'User Shield', icon: FaUserShield },
    { id: 'fingerprint', name: 'Fingerprint', icon: FaFingerprint },
    // Tools & Settings
    { id: 'wrench', name: 'Wrench', icon: FaWrench },
    { id: 'tools', name: 'Tools', icon: FaTools },
    { id: 'screwdriver', name: 'Screwdriver', icon: FaScrewdriver },
    { id: 'hammer', name: 'Hammer', icon: FaHammer },
    { id: 'cogs', name: 'Cogs', icon: FaCogs },
    // Shapes
    { id: 'circle', name: 'Circle', icon: FaCircle },
    { id: 'square', name: 'Square', icon: FaSquare },
  ];

  // Helper function to render icon
  const renderIcon = (emoji: string, size: string = 'text-2xl') => {
    if (emoji.startsWith('data:image')) {
      return <img src={emoji} alt="Category icon" className="w-8 h-8 object-cover rounded" />;
    } else if (emoji.startsWith('fa:')) {
      const iconId = emoji.slice(3);
      const iconData = fontAwesomeIcons.find(i => i.id === iconId);
      if (iconData) {
        const IconComponent = iconData.icon;
        return <IconComponent className={size} />;
      }
    }
    return <span className={size}>{emoji}</span>;
  };

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

  useEffect(() => {
    const handleThemeChange = () => {
      if (typeof window === 'undefined') {
        return;
      }
      const savedTheme = localStorage.getItem('app-theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme !== 'light');
        return;
      }
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    window.addEventListener('themeChange', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    handleThemeChange();

    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

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
        <Dialog.Overlay
          className="fixed inset-0 backdrop-blur-sm z-[100]"
          style={{
            backgroundColor: isDarkMode ? 'rgba(4, 6, 18, 0.7)' : 'rgba(15, 23, 42, 0.22)'
          }}
        />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-3xl h-[85vh] overflow-hidden z-[100] rounded-2xl border shadow-2xl"
          style={{
            background: 'var(--modal-surface-background)',
            borderColor: 'var(--modal-surface-border)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b bg-[var(--surface-secondary)]"
            style={{ borderColor: 'var(--surface-border-light)' }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: isDarkMode ? 'rgba(124, 58, 237, 0.18)' : 'rgba(124, 58, 237, 0.08)'
                }}
              >
                <FolderTree className="h-5 w-5" style={{ color: 'var(--primary-gradient-end)' }} />
              </div>
              <div>
                <Dialog.Title
                  className="text-lg font-semibold"
                  style={{ color: 'var(--primary-gradient-end)' }}
                >
                  {t.menuPromptCategories}
                </Dialog.Title>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {t.manageCategories}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex flex-col h-[calc(100%-80px)]">
            {/* Search and Add Button */}
            <div
              className="px-6 py-4 border-b bg-[var(--surface-primary)]"
              style={{ borderColor: 'var(--surface-border-light)' }}
            >
              <div className="flex gap-3">
                <Input
                  placeholder={t.searchPrompts}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleOpenCreate}
                  className="text-white shadow-sm hover:shadow-md border-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end))'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addCategory}
                </Button>
              </div>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                  <FolderTree className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {searchQuery ? t.noPromptsFound : 'No categories yet'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {searchQuery ? t.tryDifferentSearch : 'Create your first category to organize templates'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCategories.map((category) => (
                    <div
                      key={category.id}
                      className="p-4 rounded-xl border transition-colors"
                      style={{
                        background: isDarkMode ? 'rgba(38, 40, 60, 0.92)' : 'rgba(250, 251, 255, 0.94)',
                        borderColor: 'var(--surface-border)',
                        boxShadow: isDarkMode ? 'none' : '0 12px 28px rgba(15, 23, 42, 0.08)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 flex items-center justify-center rounded-lg"
                            style={{
                              background: isDarkMode ? 'rgba(56, 58, 78, 0.85)' : 'rgba(124, 58, 237, 0.08)',
                              color: 'var(--accent-emerald)'
                            }}
                          >
                            {renderIcon(category.emoji)}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {category.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              Created {new Date(category.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleOpenEdit(category)}
                            size="sm"
                            variant="ghost"
                            className="hover:bg-[var(--bg-hover)]"
                            style={{ color: 'var(--accent-cyan)' }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(category.id)}
                            size="sm"
                            variant="ghost"
                            className="hover:bg-[var(--bg-hover)]"
                            style={{ color: '#ef4444' }}
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
            <div
              className="px-6 py-4 border-t bg-[var(--surface-secondary)]"
              style={{ borderColor: 'var(--surface-border-light)' }}
            >
              <div className="flex justify-between items-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {filteredCategories.length} {language === 'zh' ? '个分类' : 'categories'}
                </p>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  className="hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
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
          <Dialog.Overlay
            className="fixed inset-0 backdrop-blur-sm z-[100]"
            style={{
              backgroundColor: isDarkMode ? 'rgba(4, 6, 18, 0.72)' : 'rgba(15, 23, 42, 0.18)'
            }}
          />
          <Dialog.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl border w-full max-w-md z-[101]"
            style={{
              background: 'var(--surface-primary)',
              borderColor: 'var(--modal-surface-border)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title
                  className="text-xl font-semibold"
                  style={{ color: 'var(--primary-gradient-end)' }}
                >
                  {editingId ? (language === 'zh' ? '编辑分类' : 'Edit Category') : t.addCategory}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t.categoryEmojiLabel}
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-16 flex items-center justify-center border rounded-xl"
                      style={{
                        borderColor: 'var(--surface-border)',
                        background: isDarkMode ? 'var(--surface-secondary)' : 'rgba(124, 58, 237, 0.06)'
                      }}
                    >
                      {renderIcon(formEmoji || '📁', 'text-4xl')}
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
                      className="h-16 px-4 border rounded-xl hover:bg-[var(--bg-hover)]"
                      style={{
                        background: isDarkMode ? 'var(--surface-secondary)' : 'rgba(124, 58, 237, 0.06)',
                        borderColor: 'var(--surface-border)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <Smile className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                  
                {/* Emoji Picker Popup with Tabs - Using Portal */}
                {showEmojiPicker && createPortal(
                  <div
                    ref={emojiPickerRef}
                    className="fixed shadow-2xl rounded-lg overflow-hidden border"
                    style={{
                      top: `${pickerPosition.top}px`,
                      left: `${pickerPosition.left}px`,
                      width: '380px',
                      zIndex: 9999,
                      background: 'var(--surface-primary)',
                      borderColor: 'var(--surface-border)',
                      color: 'var(--text-primary)',
                      ...(emojiPickerThemeStyles as CSSProperties)
                    }}
                  >
                      {/* Tabs */}
                      <div
                        className="flex border-b bg-[var(--surface-secondary)]"
                        style={{ borderColor: 'var(--surface-border)' }}
                      >
                        <button
                          onClick={() => setEmojiPickerTab('emoji')}
                          className={cn(
                            'flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 hover:bg-[var(--bg-hover)]',
                            emojiPickerTab === 'emoji'
                              ? 'text-lime-400 border-lime-400'
                              : 'border-transparent'
                          )}
                          style={{
                            background: emojiPickerTab === 'emoji' ? 'var(--surface-primary)' : 'transparent',
                            color: emojiPickerTab === 'emoji' ? undefined : 'var(--text-secondary)'
                          }}
                        >
                          {language === 'zh' ? '表情' : 'Emoji'}
                        </button>
                        <button
                          onClick={() => setEmojiPickerTab('icons')}
                          className={cn(
                            'flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 hover:bg-[var(--bg-hover)]',
                            emojiPickerTab === 'icons'
                              ? 'text-lime-400 border-lime-400'
                              : 'border-transparent'
                          )}
                          style={{
                            background: emojiPickerTab === 'icons' ? 'var(--surface-primary)' : 'transparent',
                            color: emojiPickerTab === 'icons' ? undefined : 'var(--text-secondary)'
                          }}
                        >
                          {language === 'zh' ? '图标' : 'Icons'}
                        </button>
                        <button
                          onClick={() => setEmojiPickerTab('upload')}
                          className={cn(
                            'flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 hover:bg-[var(--bg-hover)]',
                            emojiPickerTab === 'upload'
                              ? 'text-lime-400 border-lime-400'
                              : 'border-transparent'
                          )}
                          style={{
                            background: emojiPickerTab === 'upload' ? 'var(--surface-primary)' : 'transparent',
                            color: emojiPickerTab === 'upload' ? undefined : 'var(--text-secondary)'
                          }}
                        >
                          {language === 'zh' ? '上传' : 'Upload'}
                        </button>
                      </div>

                      {/* Tab Content */}
                      <div className="bg-[var(--surface-primary)]">
                        {/* Emoji Tab */}
                        {emojiPickerTab === 'emoji' && (
                          <EmojiPicker
                            key={isDarkMode ? 'emoji-dark' : 'emoji-light'}
                            onEmojiClick={handleEmojiClick}
                            theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                            width={380}
                            height={400}
                            searchPlaceHolder={language === 'zh' ? '搜索表情...' : 'Search emoji...'}
                            previewConfig={{ showPreview: false }}
                            className={isDarkMode ? 'emoji-picker-dark' : 'emoji-picker-light'}
                            style={emojiPickerThemeStyles as CSSProperties}
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
                                .filter(({ name, id }) => !iconSearch || name.toLowerCase().includes(iconSearch.toLowerCase()) || id.includes(iconSearch.toLowerCase()))
                                .map(({ icon: IconComponent, name, id }, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleIconSelect(`fa:${id}`)}
                                    className="w-12 h-12 flex items-center justify-center rounded transition-colors border border-transparent hover:border-lime-400 hover:bg-[var(--bg-hover)]"
                                    title={name}
                                  >
                                    <IconComponent className="text-xl" style={{ color: 'var(--text-secondary)' }} />
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
                              className="border-2 border-dashed rounded-lg p-8 w-full cursor-pointer transition-all text-center hover:border-lime-400 hover:bg-[var(--bg-hover)]"
                              style={{
                                borderColor: 'var(--surface-border)',
                                color: 'var(--text-secondary)',
                                background: 'var(--surface-secondary)'
                              }}
                            >
                              <div className="mb-3" style={{ color: 'var(--text-muted)' }}>
                                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                {language === 'zh' ? '上传图片' : 'Upload an image'}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
                                className="hover:bg-[var(--bg-hover)]"
                                style={{ color: 'var(--text-secondary)' }}
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
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
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
                  className="flex-1 text-white shadow-md hover:shadow-lg border-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-gradient-start), var(--accent-emerald))'
                  }}
                >
                  {t.save}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="ghost"
                  className="flex-1 hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
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
