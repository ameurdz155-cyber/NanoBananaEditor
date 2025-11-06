import { PromptTemplate } from '../types';
import { Language } from '../i18n/translations';
import { IconType } from 'react-icons';
import {
  FaPalette, FaPaintBrush, FaCamera, FaTree, FaBuilding, FaMountain, FaRobot,
  FaCarSide, FaGem, FaGlobe, FaLightbulb, FaMagic, FaPenNib, FaLeaf, FaIndustry,
  FaFilm, FaUser, FaShapes, FaMusic, FaBookOpen, FaCloud, FaFeather, FaStar, FaLayerGroup
} from 'react-icons/fa';

//================================================================//
// 1. TEMPLATE THUMBNAILS
//================================================================//

export const templateThumbnails: Record<string, string> = {
  anime: new URL('../assets/templates/Anime.png', import.meta.url).href,
  architectural: new URL('../assets/templates/Architectural Visualization.png', import.meta.url).href,
  'concept-art-character': new URL('../assets/templates/Concept Art (Character).png', import.meta.url).href,
  'concept-art-fantasy': new URL('../assets/templates/Concept Art (Fantasy).png', import.meta.url).href,
  'concept-art-painterly': new URL('../assets/templates/Concept Art (Painterly).png', import.meta.url).href,
  'concept-art-scifi': new URL('../assets/templates/Concept Art (Sci-Fi).png', import.meta.url).href,
  'environment-art': new URL('../assets/templates/Environment Art.png', import.meta.url).href,
  illustration: new URL('../assets/templates/Illustration.png', import.meta.url).href,
  'interior-design': new URL('../assets/templates/Interior Design (Visualization).png', import.meta.url).href,
  'line-art': new URL('../assets/templates/Line Art.png', import.meta.url).href,
  'photography-black-white': new URL('../assets/templates/Photography (Black and White).png', import.meta.url).href,
  'photography-general': new URL('../assets/templates/Photography (General).png', import.meta.url).href,
  'photography-landscape': new URL('../assets/templates/Photography (Landscape).png', import.meta.url).href,
  'photography-portrait': new URL('../assets/templates/Photography (Portrait).png', import.meta.url).href,
  'photography-studio': new URL('../assets/templates/Photography (Studio Lighting).png', import.meta.url).href,
  'product-rendering': new URL('../assets/templates/Product Rendering.png', import.meta.url).href,
  sketch: new URL('../assets/templates/Sketch.png', import.meta.url).href,
  vehicles: new URL('../assets/templates/Vehicles.png', import.meta.url).href,
};

//================================================================//
// 2. DEFAULT CATEGORIES
//================================================================//

export interface CategoryConfig {
  id: string;
  emoji: string;
  names: Record<Language, string>;
}

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig[] = [
    { id: 'portrait', emoji: '🧑', names: { en: 'Portrait', zh: '肖像' } },
    { id: 'landscape', emoji: '🏞️', names: { en: 'Landscape', zh: '风景' } },
    { id: 'product', emoji: '📦', names: { en: 'Product', zh: '产品' } },
    { id: 'art-style', emoji: '🎨', names: { en: 'Art Style', zh: '艺术风格' } },
    { id: 'concept', emoji: '🌌', names: { en: 'Concept Design', zh: '概念设计' } },
    { id: 'photography', emoji: '📷', names: { en: 'Photography', zh: '摄影' } },
    { id: 'architecture', emoji: '🏛️', names: { en: 'Architecture', zh: '建筑设计' } },
];

//================================================================//
// 3. ICON PACKS AND CONFIG
//================================================================//

export interface FontAwesomeIconOption {
  id: string;
  name: string;
  icon: IconType;
  tags: string[];
}

export const FONT_AWESOME_ICONS: FontAwesomeIconOption[] = [
    { id: 'palette', name: 'Palette', icon: FaPalette, tags: ['art', 'color', 'design'] },
    { id: 'paint-brush', name: 'Paint Brush', icon: FaPaintBrush, tags: ['art', 'brush', 'paint'] },
    { id: 'feather', name: 'Feather', icon: FaFeather, tags: ['sketch', 'pen', 'drawing'] },
    { id: 'star', name: 'Star', icon: FaStar, tags: ['favorite', 'highlight', 'badge'] },
    { id: 'camera', name: 'Camera', icon: FaCamera, tags: ['photo', 'photography', 'portrait'] },
    { id: 'tree', name: 'Tree', icon: FaTree, tags: ['landscape', 'nature', 'environment'] },
    { id: 'mountain', name: 'Mountain', icon: FaMountain, tags: ['landscape', 'outdoor', 'scene'] },
    { id: 'building', name: 'Building', icon: FaBuilding, tags: ['architecture', 'structure', 'city'] },
    { id: 'robot', name: 'Robot', icon: FaRobot, tags: ['futuristic', 'sci-fi', 'technology'] },
    { id: 'car-side', name: 'Car', icon: FaCarSide, tags: ['vehicle', 'concept', 'transport'] },
    { id: 'gem', name: 'Gem', icon: FaGem, tags: ['product', 'luxury', 'premium'] },
    { id: 'globe', name: 'Globe', icon: FaGlobe, tags: ['world', 'global', 'travel'] },
    { id: 'lightbulb', name: 'Lightbulb', icon: FaLightbulb, tags: ['idea', 'concept', 'inspiration'] },
    { id: 'magic', name: 'Magic Wand', icon: FaMagic, tags: ['fantasy', 'magic', 'creative'] },
    { id: 'pen-nib', name: 'Pen Nib', icon: FaPenNib, tags: ['writing', 'ink', 'sketch'] },
    { id: 'leaf', name: 'Leaf', icon: FaLeaf, tags: ['nature', 'organic', 'eco'] },
    { id: 'industry', name: 'Industry', icon: FaIndustry, tags: ['industrial', 'manufacturing', 'product'] },
    { id: 'film', name: 'Film', icon: FaFilm, tags: ['cinematic', 'film', 'story'] },
    { id: 'user', name: 'User', icon: FaUser, tags: ['people', 'portrait', 'profile'] },
    { id: 'shapes', name: 'Shapes', icon: FaShapes, tags: ['geometry', 'abstract', 'design'] },
    { id: 'music', name: 'Music', icon: FaMusic, tags: ['audio', 'creative', 'entertainment'] },
    { id: 'book-open', name: 'Book', icon: FaBookOpen, tags: ['story', 'knowledge', 'learning'] },
    { id: 'cloud', name: 'Cloud', icon: FaCloud, tags: ['sky', 'environment', 'weather'] },
    { id: 'layer-group', name: 'Layers', icon: FaLayerGroup, tags: ['composition', 'stack', 'design'] },
];

export const FONT_AWESOME_LOOKUP = FONT_AWESOME_ICONS.reduce<Record<string, IconType>>((acc, option) => {
  acc[option.id] = option.icon;
  return acc;
}, {});

export type IconPickerTab = 'emoji' | 'fontawesome' | 'url' | 'upload';

export const ICON_PICKER_TABS: Array<{ id: IconPickerTab; label: { en: string; zh: string } }> = [
  { id: 'emoji', label: { en: 'Emoji', zh: '表情符号' } },
  { id: 'fontawesome', label: { en: 'Font Awesome', zh: 'Font Awesome' } },
  { id: 'url', label: { en: 'Image URL', zh: '图片链接' } },
  { id: 'upload', label: { en: 'Upload', zh: '上传图标' } },
];


//================================================================//
// 4. DEFAULT TEMPLATES FUNCTION
//================================================================//

export const getDefaultTemplates = (language: string): PromptTemplate[] => {
  const isZh = language === 'zh';

  const categoryAssignments: Record<string, string> = {
    anime: 'art-style',
    architectural: 'architecture',
    'concept-art-character': 'concept',
    'concept-art-fantasy': 'concept',
    'concept-art-painterly': 'concept',
    'concept-art-scifi': 'concept',
    'environment-art': 'landscape',
    illustration: 'art-style',
    'interior-design': 'architecture',
    'line-art': 'art-style',
    'photography-black-white': 'photography',
    'photography-general': 'photography',
    'photography-landscape': 'landscape',
    'photography-portrait': 'portrait',
    'photography-studio': 'photography',
    'product-rendering': 'product',
    sketch: 'art-style',
    vehicles: 'concept',
  };

  const baseTemplates: Omit<PromptTemplate, 'categoryId'>[] = [
    {
      id: 'anime',
      name: isZh ? '动漫' : 'Anime',
      emoji: '🎨',
      image: templateThumbnails['anime'],
      description: isZh ? '动漫风格，粗线条和赛璐璐着色' : 'Anime style with bold outlines and cel-shaded coloring',
      positivePrompt: isZh
        ? '{prompt} 动漫风格, 粗线条, 赛璐璐着色, 少年漫画, 青年漫画'
        : '{prompt} anime++, bold outline, cel-shaded coloring, shounen, seinen',
      negativePrompt: isZh
        ? '{photo}+++, 灰度, 纯黑, 绘画'
        : '{photo}+++, greyscale, solid black, painting',
      isDefault: true,
      createdAt: Date.now(),
    },
    // ... (All other template objects from the original file go here) ...
    {
      id: 'vehicles',
      name: isZh ? '车辆' : 'Vehicles',
      emoji: '🚗',
      image: templateThumbnails['vehicles'],
      description: isZh ? '车辆概念艺术，动态感' : 'Vehicle concept art with motion',
      positivePrompt: isZh
        ? '{prompt} 车辆概念艺术, 动态视角, 运动模糊, 反射材质'
        : '{prompt} vehicle concept art, dynamic perspective, motion blur, reflective materials',
      negativePrompt: isZh
        ? '静态侧面, 低细节, 卡通化, 低多边形'
        : 'static profile, low detail, cartoonish, low poly',
      isDefault: true,
      createdAt: Date.now(),
    },
  ];

  return baseTemplates.map((template) => ({
    ...template,
    categoryId: categoryAssignments[template.id],
  }));
};