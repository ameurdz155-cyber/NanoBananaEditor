import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  Edit2,
  X,
  UploadCloud,
  Tag
} from 'lucide-react';
import { IconType } from 'react-icons';
import {
  FaPalette,
  FaPaintBrush,
  FaCamera,
  FaTree,
  FaBuilding,
  FaMountain,
  FaRobot,
  FaCarSide,
  FaGem,
  FaGlobe,
  FaLightbulb,
  FaMagic,
  FaPenNib,
  FaLeaf,
  FaIndustry,
  FaFilm,
  FaUser,
  FaShapes,
  FaMusic,
  FaBookOpen,
  FaCloud,
  FaFeather,
  FaStar,
  FaLayerGroup
} from 'react-icons/fa';
import { cn } from '../utils/cn';
import { getTranslation, Language } from '../i18n/translations';
import { PromptTemplate } from '../types';

const templateThumbnails: Record<string, string> = {
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

interface CategoryConfig {
  id: string;
  emoji: string;
  names: Record<Language, string>;
}

interface DisplayCategory {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  source: 'default' | 'custom';
  count?: number;
}

type IconPickerTab = 'emoji' | 'fontawesome' | 'url' | 'upload';

const DEFAULT_CATEGORY_CONFIG: CategoryConfig[] = [
  {
    id: 'portrait',
    emoji: '🧑',
    names: { en: 'Portrait', zh: '肖像' },
  },
  {
    id: 'landscape',
    emoji: '🏞️',
    names: { en: 'Landscape', zh: '风景' },
  },
  {
    id: 'product',
    emoji: '📦',
    names: { en: 'Product', zh: '产品' },
  },
  {
    id: 'art-style',
    emoji: '🎨',
    names: { en: 'Art Style', zh: '艺术风格' },
  },
  {
    id: 'concept',
    emoji: '🌌',
    names: { en: 'Concept Design', zh: '概念设计' },
  },
  {
    id: 'photography',
    emoji: '📷',
    names: { en: 'Photography', zh: '摄影' },
  },
  {
    id: 'architecture',
    emoji: '🏛️',
    names: { en: 'Architecture', zh: '建筑设计' },
  },
];

interface FontAwesomeIconOption {
  id: string;
  name: string;
  icon: IconType;
  tags: string[];
}

const FONT_AWESOME_ICONS: FontAwesomeIconOption[] = [
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

const FONT_AWESOME_LOOKUP = FONT_AWESOME_ICONS.reduce<Record<string, IconType>>((acc, option) => {
  acc[option.id] = option.icon;
  return acc;
}, {});

const ICON_PICKER_TABS: Array<{ id: IconPickerTab; label: { en: string; zh: string } }> = [
  { id: 'emoji', label: { en: 'Emoji', zh: '表情符号' } },
  { id: 'fontawesome', label: { en: 'Font Awesome', zh: 'Font Awesome' } },
  { id: 'url', label: { en: 'Image URL', zh: '图片链接' } },
  { id: 'upload', label: { en: 'Upload', zh: '上传图标' } },
];

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

const renderIconValue = (value?: string, className?: string) => {
  if (!value) {
    return null;
  }

  if (value.startsWith('fa:')) {
    const iconId = value.slice(3);
    const IconComponent = FONT_AWESOME_LOOKUP[iconId];
    if (IconComponent) {
      return <IconComponent className={cn('shrink-0', className)} />;
    }
  }

  const normalized = value.toLowerCase();
  if (
    value.startsWith('url:') ||
    value.startsWith('data:') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')
  ) {
    const src = value.startsWith('url:') ? value.slice(4) : value;
    return (
      <img
        src={src}
        alt=""
        className={cn('h-full w-full object-contain', className)}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <span className={cn('inline-flex items-center justify-center leading-none', className)}>
      {value}
    </span>
  );
};

const getIconLabel = (value?: string) => {
  if (!value) {
    return '';
  }

  if (value.startsWith('fa:')) {
    const iconId = value.slice(3);
    const match = FONT_AWESOME_ICONS.find((icon) => icon.id === iconId);
    return match ? `${match.name} ` : '';
  }

  const normalized = value.toLowerCase();
  if (
    value.startsWith('url:') ||
    value.startsWith('data:') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')
  ) {
    return '';
  }

  return `${value} `;
};

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

  const baseTemplates: PromptTemplate[] = [
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
    {
      id: 'architectural',
      name: isZh ? '建筑可视化' : 'Architectural Visualization',
      emoji: '🏛️',
      image: templateThumbnails['architectural'],
      description: isZh ? '专业建筑渲染' : 'Professional architectural renders',
      positivePrompt: isZh
        ? '{prompt} 建筑可视化, 照片级渲染, 简洁线条, 柔和日光'
        : '{prompt} architectural visualization, photoreal render, clean lines, soft daylight',
      negativePrompt: isZh
        ? '草图, 手绘, 噪点, 低质量'
        : 'sketch, hand-drawn, noisy, low quality',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'concept-art-character',
      name: isZh ? '概念艺术（角色）' : 'Concept Art (Character)',
      emoji: '🎭',
      image: templateThumbnails['concept-art-character'],
      description: isZh ? '角色概念艺术，动态姿势' : 'Character concept art with dynamic posing',
      positivePrompt: isZh
        ? '{prompt} 角色概念艺术, 动态姿势, 富有表现力的光照, 详细服装'
        : '{prompt} character concept art, dynamic pose, expressive lighting, detailed costume',
      negativePrompt: isZh
        ? '平面着色, 僵硬姿势, 低细节, 杂乱背景'
        : 'flat shading, stiff pose, low detail, cluttered background',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'concept-art-fantasy',
      name: isZh ? '概念艺术（奇幻）' : 'Concept Art (Fantasy)',
      emoji: '🐉',
      image: templateThumbnails['concept-art-fantasy'],
      description: isZh ? '奇幻概念艺术，魔法氛围' : 'Fantasy concept art with magical atmosphere',
      positivePrompt: isZh
        ? '{prompt} 奇幻概念艺术, 魔法氛围, 详细环境, 史诗规模'
        : '{prompt} fantasy concept art, magical atmosphere, detailed environment, epic scale',
      negativePrompt: isZh
        ? '现代, 写实, 照片, 当代'
        : 'modern, realistic, photo, contemporary',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'concept-art-painterly',
      name: isZh ? '概念艺术（绘画风）' : 'Concept Art (Painterly)',
      emoji: '🖌️',
      image: templateThumbnails['concept-art-painterly'],
      description: isZh ? '绘画风概念艺术，大胆笔触' : 'Painterly concept art with bold brush strokes',
      positivePrompt: isZh
        ? '{prompt} 绘画风概念艺术, 可见笔触, 丰富色彩渐变, 高度奇幻'
        : '{prompt} painterly concept art, visible brush strokes, rich color gradients, high fantasy',
      negativePrompt: isZh
        ? '照片级写实, 无菌, 低对比度, 平面色彩'
        : 'photorealistic, sterile, low contrast, flat color',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'concept-art-scifi',
      name: isZh ? '概念艺术（科幻）' : 'Concept Art (Sci-Fi)',
      emoji: '🚀',
      image: templateThumbnails['concept-art-scifi'],
      description: isZh ? '未来科幻概念艺术' : 'Futuristic sci-fi concept art',
      positivePrompt: isZh
        ? '{prompt} 科幻概念艺术, 未来主义, 先进科技, 电影感'
        : '{prompt} sci-fi concept art, futuristic, advanced technology, cinematic',
      negativePrompt: isZh
        ? '中世纪, 奇幻, 历史, 复古'
        : 'medieval, fantasy, historical, vintage',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'environment-art',
      name: isZh ? '环境艺术' : 'Environment Art',
      emoji: '🌄',
      image: templateThumbnails['environment-art'],
      description: isZh ? '环境概念艺术，电影般的景观' : 'Environment concept art with cinematic vistas',
      positivePrompt: isZh
        ? '{prompt} 环境概念艺术, 壮丽景色, 体积光照, 大气透视'
        : '{prompt} environment concept art, sweeping vista, volumetric lighting, atmospheric perspective',
      negativePrompt: isZh
        ? '拥挤, 暗淡光照, 低细节, 噪点'
        : 'crowded, dull lighting, low detail, noisy',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'illustration',
      name: isZh ? '插画' : 'Illustration',
      emoji: '🖼️',
      image: templateThumbnails['illustration'],
      description: isZh ? '数字插画，鲜艳色彩' : 'Digital illustration with vibrant colors',
      positivePrompt: isZh
        ? '{prompt} 数字插画, 鲜艳色彩, 风格化, 艺术感'
        : '{prompt} digital illustration, vibrant colors, stylized, artistic',
      negativePrompt: isZh
        ? '照片, 写实, 3D渲染'
        : 'photo, realistic, 3d render',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'interior-design',
      name: isZh ? '室内设计（可视化）' : 'Interior Design (Visualization)',
      emoji: '🛋️',
      image: templateThumbnails['interior-design'],
      description: isZh ? '照片级室内设计可视化' : 'Photoreal interior design visualization',
      positivePrompt: isZh
        ? '{prompt} 室内设计可视化, 现代家具风格, 全局光照, 照片级渲染'
        : '{prompt} interior design visualization, modern furniture styling, global illumination, photoreal rendering',
      negativePrompt: isZh
        ? '杂乱, 凌乱, 低光照, 未完成'
        : 'clutter, messy, low light, unfinished',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'line-art',
      name: isZh ? '线稿' : 'Line Art',
      emoji: '✍️',
      image: templateThumbnails['line-art'],
      description: isZh ? '清晰线稿，墨水细节' : 'Clean line art with inking detail',
      positivePrompt: isZh
        ? '{prompt} 清晰线稿, 清脆轮廓, 墨水绘制, 高对比度'
        : '{prompt} clean line art, crisp outlines, inked drawing, high contrast',
      negativePrompt: isZh
        ? '彩色, 阴影, 渐变, 绘画'
        : 'color, shading, gradients, paint',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'photography-black-white',
      name: isZh ? '摄影（黑白）' : 'Photography (Black and White)',
      emoji: '📷',
      image: templateThumbnails['photography-black-white'],
      description: isZh ? '高对比度黑白摄影' : 'High contrast black and white photography',
      positivePrompt: isZh
        ? '{prompt} 黑白摄影, 戏剧性光照, 细颗粒, 高对比度'
        : '{prompt} black and white photography, dramatic lighting, fine grain, high contrast',
      negativePrompt: isZh
        ? '彩色, 过度饱和, 卡通, 插画'
        : 'colorful, oversaturated, cartoon, illustration',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'photography-general',
      name: isZh ? '摄影（通用）' : 'Photography (General)',
      emoji: '📸',
      image: templateThumbnails['photography-general'],
      description: isZh ? '通用多功能摄影' : 'Versatile general-purpose photography',
      positivePrompt: isZh
        ? '{prompt} 专业摄影, 锐利对焦, 自然光照, 景深'
        : '{prompt} professional photography, sharp focus, natural lighting, depth of field',
      negativePrompt: isZh
        ? '模糊, 噪点, 低分辨率, 业余快照'
        : 'blurry, noisy, low resolution, amateur snapshot',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'photography-landscape',
      name: isZh ? '摄影（风景）' : 'Photography (Landscape)',
      emoji: '🏞️',
      image: templateThumbnails['photography-landscape'],
      description: isZh ? '风景摄影，戏剧性光照' : 'Landscape photography with dramatic lighting',
      positivePrompt: isZh
        ? '{prompt} 风景摄影, 黄金时刻, 广阔景色, 戏剧性天空'
        : '{prompt} landscape photography, golden hour, expansive scenery, dramatic sky',
      negativePrompt: isZh
        ? '室内, 工作室, 人工光照, 杂乱前景'
        : 'indoor, studio, artificial lighting, cluttered foreground',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'photography-portrait',
      name: isZh ? '摄影（肖像）' : 'Photography (Portrait)',
      emoji: '👤',
      image: templateThumbnails['photography-portrait'],
      description: isZh ? '专业肖像摄影，工作室灯光' : 'Professional portrait photography with studio lighting',
      positivePrompt: isZh
        ? '{prompt} 肖像摄影, 专业照明, 虚化背景, 锐利对焦'
        : '{prompt} portrait photography, professional lighting, bokeh background, sharp focus',
      negativePrompt: isZh
        ? '插画, 绘画, 素描, 卡通, 动漫'
        : 'illustration, painting, drawing, cartoon, anime',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'photography-studio',
      name: isZh ? '摄影（工作室灯光）' : 'Photography (Studio Lighting)',
      emoji: '💡',
      image: templateThumbnails['photography-studio'],
      description: isZh ? '工作室肖像摄影，可控照明' : 'Studio portrait photography with controlled lighting',
      positivePrompt: isZh
        ? '{prompt} 工作室肖像, 柔光箱照明, 轮廓光, 干净背景, 超级细节'
        : '{prompt} studio portrait, softbox lighting, rim light, clean backdrop, ultra detailed',
      negativePrompt: isZh
        ? '强烈闪光, 颗粒感, 低光照, 抓拍快照'
        : 'harsh flash, grainy, low light, candid snapshot',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'product-rendering',
      name: isZh ? '产品渲染' : 'Product Rendering',
      emoji: '📦',
      image: templateThumbnails['product-rendering'],
      description: isZh ? '精致产品渲染，用于营销' : 'Polished product renders for marketing',
      positivePrompt: isZh
        ? '{prompt} 产品渲染, 工作室照明, 无缝背景, 光泽反射, 广告质量'
        : '{prompt} product render, studio lighting, seamless background, glossy reflections, advertising quality',
      negativePrompt: isZh
        ? '划痕, 指纹, 噪点, 低多边形'
        : 'scratches, fingerprints, noisy, low poly',
      isDefault: true,
      createdAt: Date.now(),
    },
    {
      id: 'sketch',
      name: isZh ? '草图' : 'Sketch',
      emoji: '✏️',
      image: templateThumbnails['sketch'],
      description: isZh ? '宽松铅笔草图风格' : 'Loose pencil sketch style',
      positivePrompt: isZh
        ? '{prompt} 铅笔草图, 构图线, 宽松阴影, 概念草稿'
        : '{prompt} pencil sketch, construction lines, loose shading, concept rough',
      negativePrompt: isZh
        ? '数字绘画, 全彩色, 精细, 照片级'
        : 'digital painting, full color, polished, photoreal',
      isDefault: true,
      createdAt: Date.now(),
    },
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
    categoryId: template.categoryId ?? categoryAssignments[template.id],
  }));
};

export const DEFAULT_TEMPLATES: PromptTemplate[] = getDefaultTemplates('en');

interface TemplatesViewProps {
  onTemplateSelect?: (templateInfo: { name: string; image?: string; emoji?: string } | null) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onTemplateSelect }) => {
  const { 
    selectedTemplate, 
    setSelectedTemplate, 
    language,
    customTemplates,
    addCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
    promptCategories,
    addPromptCategory,
    updatePromptCategory,
    deletePromptCategory
  } = useAppStore();
  const t = getTranslation(language);
  const [isDarkMode, setIsDarkMode] = React.useState(resolveIsDarkMode);
  
  // Get localized default templates
  const localizedDefaultTemplates = React.useMemo(() => getDefaultTemplates(language), [language]);
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    my: true,
    default: true,
  });
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<PromptTemplate | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>('all');
  const [categoryForm, setCategoryForm] = React.useState({
    name: '',
    emoji: '⭐',
  });
  const [iconPickerTab, setIconPickerTab] = React.useState<'emoji' | 'fontawesome' | 'url' | 'upload'>('emoji');
  const [iconSearch, setIconSearch] = React.useState('');
  const defaultCategoryId = React.useMemo(() => DEFAULT_CATEGORY_CONFIG[0]?.id ?? '', []);
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [categoryManagerMode, setCategoryManagerMode] = React.useState<'create' | 'edit' | 'view'>('create');
  const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
  const isPremiumUser = useAuthStore((state) => state.isPremiumUser);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleThemeChange = () => {
      setIsDarkMode(resolveIsDarkMode());
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  const resolvedCategories = React.useMemo<DisplayCategory[]>(() => {
    const map = new Map<string, DisplayCategory>();

    DEFAULT_CATEGORY_CONFIG.forEach((config) => {
      map.set(config.id, {
        id: config.id,
        emoji: config.emoji,
        name: config.names[language] ?? config.names.en,
        source: 'default',
      });
    });

    promptCategories.forEach((category) => {
      map.set(category.id, {
        id: category.id,
        emoji: category.emoji,
        image: category.image,
        name: category.name,
        source: 'custom',
      });
    });

    return Array.from(map.values());
  }, [language, promptCategories]);

  const categoryLookup = React.useMemo(() => {
    const map = new Map<string, DisplayCategory>();
    resolvedCategories.forEach((category) => map.set(category.id, category));
    return map;
  }, [resolvedCategories]);

  const categoryCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    let total = 0;
    let uncategorized = 0;

    const tally = (template: PromptTemplate) => {
      total += 1;
      if (template.categoryId) {
        counts.set(template.categoryId, (counts.get(template.categoryId) ?? 0) + 1);
      } else {
        uncategorized += 1;
      }
    };

    localizedDefaultTemplates.forEach(tally);

    if (isPremiumUser) {
      customTemplates.forEach(tally);
    }

    counts.set('all', total);
    counts.set('uncategorized', uncategorized);

    return counts;
  }, [customTemplates, localizedDefaultTemplates, isPremiumUser]);

  const categoryTabs = React.useMemo<DisplayCategory[]>(() => {
    const categoriesWithCounts = resolvedCategories.map((category) => ({
      ...category,
      count: categoryCounts.get(category.id) ?? 0,
    }));

    return [
      {
        id: 'all',
        name: t.allCategories,
        emoji: '✨',
        source: 'default',
        count: categoryCounts.get('all') ?? 0,
      },
      {
        id: 'uncategorized',
        name: t.uncategorized,
        emoji: '❔',
        source: 'default',
        count: categoryCounts.get('uncategorized') ?? 0,
      },
      ...categoriesWithCounts,
    ];
  }, [categoryCounts, resolvedCategories, t]);
  
  // Form state for create/edit modal
  const [formData, setFormData] = React.useState({
    name: '',
    positivePrompt: '',
    negativePrompt: '',
    description: '',
    emoji: '',
    categoryId: '',
    image: '',
  });
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const iconUploadInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setFormData((prev) => ({ ...prev, image: result }));
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleCategoryIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setCategoryForm((prev) => ({ ...prev, emoji: result }));
        setIconPickerTab('upload');
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const resetCategoryForm = React.useCallback(() => {
    setCategoryForm({ name: '', emoji: '⭐' });
    setIconPickerTab('emoji');
    setIconSearch('');
    setEditingCategoryId(null);
    setCategoryManagerMode('create');
  }, []);

  const filteredFontAwesomeIcons = React.useMemo(() => {
    const query = iconSearch.trim().toLowerCase();
    if (!query) {
      return FONT_AWESOME_ICONS;
    }
    return FONT_AWESOME_ICONS.filter((option) =>
      option.name.toLowerCase().includes(query) ||
      option.tags.some((tag) => tag.includes(query))
    );
  }, [iconSearch]);

  React.useEffect(() => {
    if (iconPickerTab !== 'fontawesome') {
      setIconSearch('');
    }
  }, [iconPickerTab]);

  React.useEffect(() => {
    if (!isPremiumUser) {
      setShowCreateModal(false);
      setShowCategoryModal(false);
      setEditingTemplate(null);
      setEditingCategoryId(null);
    }
  }, [isPremiumUser]);

  const openCategoryModal = React.useCallback((categoryId?: string) => {
    if (!isPremiumUser) {
      return;
    }
    if (categoryId) {
      const resolved = resolvedCategories.find((category) => category.id === categoryId);
      if (resolved) {
        setCategoryForm({
          name: resolved.name,
          emoji: resolved.emoji ?? '⭐',
        });
        setIconPickerTab('emoji');
        setIconSearch('');
        if (resolved.source === 'custom') {
          setEditingCategoryId(categoryId);
          setCategoryManagerMode('edit');
        } else {
          setEditingCategoryId(null);
          setCategoryManagerMode('view');
        }
      } else {
        resetCategoryForm();
      }
    } else {
      resetCategoryForm();
    }

    setShowCategoryModal(true);
  }, [isPremiumUser, resetCategoryForm, resolvedCategories]);

  const handleSaveCategory = () => {
    const name = categoryForm.name.trim();
    const emoji = categoryForm.emoji.trim();

    if (!name) {
      alert(language === 'zh' ? '请填写分类名称' : 'Please provide a category name');
      return;
    }

    if (categoryManagerMode === 'edit' && editingCategoryId) {
      updatePromptCategory(editingCategoryId, {
        name,
        emoji: emoji || undefined,
      });
      setActiveCategory(editingCategoryId);
      setShowCategoryModal(false);
      resetCategoryForm();
      return;
    }

    const sanitized = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-');
    let id = sanitized || `category-${Date.now()}`;
    if (resolvedCategories.some((category) => category.id === id)) {
      id = `category-${Date.now()}`;
    }

    addPromptCategory({
      id,
      name,
      emoji: emoji || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    setActiveCategory(id);
    setShowCategoryModal(false);
    resetCategoryForm();
  };

  const handleDeleteCategory = (categoryId: string) => {
    const confirmMessage = language === 'zh'
      ? '确定要删除这个分类吗？分类中的模板将被设为未分类。'
      : 'Delete this category? Templates within will become uncategorized.';

    if (!confirm(confirmMessage)) {
      return;
    }

    deletePromptCategory(categoryId);

    setActiveCategory((prev) => (prev === categoryId ? 'all' : prev));
    if (editingCategoryId === categoryId) {
      resetCategoryForm();
      setShowCategoryModal(false);
    }
  };

  const handleCategoryChipClick = (category: DisplayCategory) => {
    setActiveCategory(category.id);
  };

  // No longer needed - templates are now in Zustand store which persists automatically
  // React.useEffect(() => {
  //   try {
  //     const savedTemplates = localStorage.getItem('my-prompt-templates');
  //     if (savedTemplates) {
  //       const parsed = JSON.parse(savedTemplates);
  //       setMyTemplates(parsed);
  //     }
  //   } catch (error) {
  //     console.error('Failed to load templates:', error);
  //   }
  // }, []);

  // React.useEffect(() => {
  //   try {
  //     localStorage.setItem('my-prompt-templates', JSON.stringify(myTemplates));
  //   } catch (error) {
  //     console.error('Failed to save templates:', error);
  //   }
  // }, [myTemplates]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const openCreateModal = () => {
    if (!isPremiumUser) {
      return;
    }
    const initialCategory = activeCategory === 'all'
      ? defaultCategoryId
      : activeCategory === 'uncategorized'
        ? ''
        : activeCategory;
    const initialEmoji = initialCategory
      ? categoryLookup.get(initialCategory)?.emoji ?? ''
      : '';

    setFormData({
      name: '',
      positivePrompt: '',
      negativePrompt: '',
      description: '',
      emoji: initialEmoji,
      categoryId: initialCategory,
      image: '',
    });
    setEditingTemplate(null);
    setShowCreateModal(true);
  };

  const openEditModal = (template: PromptTemplate) => {
    setFormData({
      name: template.name,
      positivePrompt: template.positivePrompt,
      negativePrompt: template.negativePrompt || '',
      description: template.description || '',
      emoji: template.emoji || '',
      categoryId: template.categoryId || '',
      image: template.image || '',
    });
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  const openDuplicateModal = (template: PromptTemplate) => {
    const inferredCategory = template.categoryId
      || (activeCategory !== 'all' && activeCategory !== 'uncategorized' ? activeCategory : '');
    setFormData({
      name: `${template.name} (Copy)`,
      positivePrompt: template.positivePrompt,
      negativePrompt: template.negativePrompt || '',
      description: template.description || '',
      emoji: template.emoji || categoryLookup.get(inferredCategory)?.emoji || '',
      categoryId: inferredCategory,
      image: template.image || '',
    });
    setEditingTemplate(null);
    setShowCreateModal(true);
  };

  const handleSaveTemplate = () => {
    if (!formData.name.trim() || !formData.positivePrompt.trim()) {
      alert(language === 'zh' ? '请输入名称和正面提示词' : 'Please enter a name and positive prompt');
      return;
    }

    const emoji = formData.emoji.trim();
    const categoryId = formData.categoryId.trim();
    const image = formData.image.trim();

    if (editingTemplate) {
      // Update existing template
      updateCustomTemplate(editingTemplate.id, {
        name: formData.name.trim(),
        positivePrompt: formData.positivePrompt.trim(),
        negativePrompt: formData.negativePrompt.trim(),
        description: formData.description.trim(),
        image: image || undefined,
        emoji: emoji || undefined,
        categoryId: categoryId || undefined,
      });
    } else {
      // Create new template
      const newTemplate: PromptTemplate = {
        id: `custom-${Date.now()}`,
        name: formData.name.trim(),
        positivePrompt: formData.positivePrompt.trim(),
        negativePrompt: formData.negativePrompt.trim(),
        description: formData.description.trim(),
        image: image || undefined,
        emoji: emoji || undefined,
        categoryId: categoryId || undefined,
        createdAt: Date.now(),
      };
      addCustomTemplate(newTemplate);
    }

    setShowCreateModal(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteCustomTemplate(templateId);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filterByCategory = React.useCallback(
    (template: PromptTemplate) => {
      if (activeCategory === 'all') {
        return true;
      }
      if (activeCategory === 'uncategorized') {
        return !template.categoryId;
      }
      return template.categoryId === activeCategory;
    },
    [activeCategory]
  );

  const filteredMyTemplates = React.useMemo(
    () =>
      customTemplates
        .filter(filterByCategory)
        .filter((template) =>
          !normalizedQuery || template.name.toLowerCase().includes(normalizedQuery)
        ),
    [customTemplates, filterByCategory, normalizedQuery]
  );

  const filteredDefaultTemplates = React.useMemo(
    () =>
      localizedDefaultTemplates
        .filter(filterByCategory)
        .filter((template) =>
          !normalizedQuery || template.name.toLowerCase().includes(normalizedQuery)
        ),
    [localizedDefaultTemplates, filterByCategory, normalizedQuery]
  );

  const renderTemplateCard = (template: PromptTemplate, isCustom: boolean) => {
    const categoryInfo = template.categoryId ? categoryLookup.get(template.categoryId) : undefined;

    const isSelected = selectedTemplate === template.id;

    const cardClasses = cn(
      'group relative w-full cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 backdrop-blur hover:border-purple-500/40 h-full',
      isSelected
        ? 'shadow-[0_15px_35px_-18px_rgba(168,85,247,0.45)]'
        : 'hover:shadow-[0_18px_36px_-20px_rgba(168,85,247,0.35)] hover:-translate-y-0.5'
    );

    const cardStyle: React.CSSProperties = {
      background: 'var(--surface-secondary)',
      borderColor: isSelected ? 'rgba(168, 85, 247, 0.4)' : 'var(--surface-border)'
    };

    const contentClasses = 'cursor-pointer flex h-full flex-col gap-4 p-4';

    const thumbnailClasses = 'relative overflow-hidden rounded-lg border bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-purple-500/25 flex items-center justify-center w-full h-32';

    const thumbnailStyle = {
      borderColor: 'var(--surface-border)'
    };

    const templateIconNode = !template.image
      ? renderIconValue(
          template.emoji,
          cn(
            'w-12 h-12 text-3xl leading-none flex items-center justify-center',
            isDarkMode ? 'text-purple-200' : 'text-purple-600'
          )
        )
      : null;

    const categoryIconNode = renderIconValue(
      categoryInfo?.emoji,
      cn(
        'w-4 h-4 text-xs flex items-center justify-center',
        isDarkMode ? 'text-purple-200' : 'text-purple-500'
      )
    );

    const activeActionsClasses = 'flex w-full items-center justify-end gap-2 pt-2';

    const hoverActionsClasses = 'flex w-full items-center justify-end gap-2 pt-2 opacity-0 transition-opacity group-hover:opacity-100';

    return (
  <div key={template.id} className={cardClasses} style={cardStyle}>
        <div
          className={contentClasses}
          onClick={() => {
            setSelectedTemplate(template.id);
            if (onTemplateSelect) {
              onTemplateSelect({
                name: template.name,
                image: template.image,
                emoji: template.emoji,
              });
            }
          }}
        >
          <div className={thumbnailClasses} style={thumbnailStyle}>
            {template.image ? (
              <img
                src={template.image}
                alt={template.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              templateIconNode || (
                <span
                  className={cn(
                    'text-2xl font-semibold',
                    isDarkMode ? 'text-purple-200' : 'text-purple-600'
                  )}
                >
                  {template.name.charAt(0).toUpperCase()}
                </span>
              )
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{template.name}</h4>
              {selectedTemplate === template.id && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border',
                    isDarkMode
                      ? 'border-purple-500/40 bg-purple-500/15 text-purple-200'
                      : 'border-purple-300 bg-purple-100 text-purple-700'
                  )}
                >
                  {language === 'zh' ? '已应用' : 'Active'}
                </span>
              )}
            </div>

            {template.description && (
              <p
                className="text-xs line-clamp-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {template.description}
              </p>
            )}

            {categoryInfo ? (
              <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {categoryIconNode}
                <span>{categoryInfo.name}</span>
              </div>
            ) : !template.categoryId ? (
              <div className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{t.uncategorized}</div>
            ) : null}
          </div>

          {selectedTemplate === template.id ? (
            <div className={activeActionsClasses}>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div className={hoverActionsClasses}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-[var(--bg-hover)]"
                style={{ color: 'var(--text-secondary)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  openDuplicateModal(template);
                }}
                title={t.duplicateTemplate}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {isCustom && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(template);
                    }}
                    title={t.editTemplate}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-200 hover:bg-red-500/15"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id);
                    }}
                    title={t.deleteTemplate}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const templateListClasses = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5';

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* Search, Actions, and Categories */}
      <div className="flex-shrink-0 mb-3 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder={language === 'zh' ? '按名称搜索' : 'Search by name'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full sm:flex-1 transition-colors',
              isDarkMode
                ? 'bg-[var(--surface-primary)]/80 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] border-[color:var(--surface-border)] focus-visible:bg-[var(--surface-primary)]'
                : 'bg-white/95 text-slate-900 placeholder:text-slate-500 border-slate-200 focus-visible:bg-white focus-visible:shadow-[0_0_18px_rgba(168,85,247,0.12)]'
            )}
            style={
              isDarkMode
                ? { color: 'var(--text-primary)' }
                : { color: 'var(--text-primary)' }
            }
          />
          <div className="flex items-center gap-1">
            {isPremiumUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openCreateModal}
                title={t.createTemplate}
                className="h-8 w-8"
                type="button"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span
              className="text-xs uppercase tracking-wide"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {t.templateCategories}
            </span>
            {isPremiumUser && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-2 text-xs transition-colors',
                  isDarkMode
                    ? 'text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                    : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5'
                )}
                onClick={() => openCategoryModal()}
                type="button"
              >
                <Tag className="h-3 w-3" />
                <span className="ml-1 hidden sm:inline">{t.manageCategories}</span>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((category) => {
              const isActive = activeCategory === category.id;
              const countValue = category.count ?? 0;
              const countClasses = cn(
                'ml-1 text-[11px] font-medium transition-colors',
                isActive
                  ? isDarkMode
                    ? 'text-purple-100'
                    : 'text-purple-700'
                  : isDarkMode
                    ? 'text-[color:var(--text-tertiary)]'
                    : 'text-slate-500'
              );
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChipClick(category)}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-all',
                    isActive
                      ? isDarkMode
                        ? 'border-purple-500 bg-purple-500/10 text-purple-200 shadow-sm'
                        : 'border-purple-300 bg-purple-100 text-purple-700 shadow-sm'
                      : isDarkMode
                        ? 'border-[color:var(--surface-border)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-purple-400/40 hover:bg-purple-500/5'
                        : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-purple-300/60 hover:bg-purple-50'
                  )}
                  type="button"
                >
                  {renderIconValue(category.emoji, 'w-4 h-4 text-sm leading-none flex items-center justify-center')}
                  <span className="inline-flex items-center gap-1">
                    <span>{category.name}</span>
                    <span className={countClasses}>({countValue})</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-3">
        {/* My Templates Section */}
        {isPremiumUser ? (
          <div>
            <button
              onClick={() => toggleSection('my')}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-lg transition-colors group',
                isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
              )}
              type="button"
            >
              <div className="flex items-center gap-2">
                {expandedSections.my ? (
                  <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                ) : (
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                )}
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>My Templates</h3>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{customTemplates.length}</span>
            </button>

            {expandedSections.my && (
              <div className="mt-2">
                {filteredMyTemplates.length === 0 ? (
                  <div className="text-center py-6 text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                    <p>{searchQuery ? t.noMatchingTemplates : t.noPromptTemplatesAvailable}</p>
                    {!searchQuery && (
                      <p style={{ color: 'var(--text-tertiary)' }}>{t.createTemplateFirstMessage}</p>
                    )}
                  </div>
                ) : (
                  <div className={templateListClasses}>
                    {filteredMyTemplates.map(template => renderTemplateCard(template, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'rounded-lg border border-dashed p-6 text-center transition-colors',
              isDarkMode ? 'border-purple-500/40 bg-purple-500/10' : 'border-purple-200 bg-purple-50'
            )}
          >
            <p className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t.premiumFeatureTitle}</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{t.premiumFeatureDescription}</p>
            <Button className={cn('btn-premium', !isDarkMode && 'shadow-[0_12px_30px_-12px_rgba(168,85,247,0.45)]')} type="button">
              {t.upgradeToUnlock}
            </Button>
          </div>
        )}

        {/* Default Templates Section */}
        <div>
          <button
            onClick={() => toggleSection('default')}
            className={cn(
              'w-full flex items-center justify-between p-2 rounded-lg transition-colors group',
              isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
            )}
            type="button"
          >
            <div className="flex items-center gap-2">
              {expandedSections.default ? (
                <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              ) : (
                <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              )}
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Default Templates</h3>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{localizedDefaultTemplates.length}</span>
          </button>

          {expandedSections.default && (
            <div className="mt-2">
              {filteredDefaultTemplates.length === 0 ? (
                <div className="text-center py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t.noMatchingTemplates}
                </div>
              ) : (
                <div className={templateListClasses}>
                  {filteredDefaultTemplates.map(template => renderTemplateCard(template, false))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Management Modal */}
      <Dialog.Root
        open={isPremiumUser && showCategoryModal}
        onOpenChange={(open) => {
          if (!isPremiumUser) {
            return;
          }
          setShowCategoryModal(open);
          if (!open) {
            resetCategoryForm();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-6 z-50 shadow-2xl transition-colors"
            style={{
              width: '90vw',
              maxWidth: '960px',
              maxHeight: '85vh',
              background: 'var(--modal-surface-background)',
              border: '1px solid var(--modal-surface-border)',
              color: 'var(--text-primary)'
            }}
          >
            {(() => {
              const isViewOnly = categoryManagerMode === 'view';
              const modalTitle = categoryManagerMode === 'edit'
                ? language === 'zh' ? '编辑分类' : 'Edit Category'
                : categoryManagerMode === 'view'
                  ? language === 'zh' ? '查看分类' : 'View Category'
                  : t.addCategory;

              return (
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-[color:var(--text-primary)]">
                        {modalTitle}
                      </Dialog.Title>
                      <p className="text-sm mt-1 text-[color:var(--text-secondary)]">
                        {language === 'zh'
                          ? '管理模板分类、图标与名称。默认分类不可编辑。'
                          : 'Manage names and icons for your categories. Default categories are view only.'}
                      </p>
                    </div>
                    <Dialog.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8 transition-colors',
                          isDarkMode
                            ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                            : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5'
                        )}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Dialog.Close>
                  </div>

                  <div className="grid gap-6 mt-6 md:grid-cols-[240px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'w-full border-dashed transition-colors',
                          isDarkMode
                            ? 'border-purple-500/40 text-purple-200 hover:text-purple-100'
                            : 'border-purple-300 text-purple-600 hover:text-purple-700 bg-purple-50/70'
                        )}
                        type="button"
                        onClick={() => {
                          resetCategoryForm();
                          setShowCategoryModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t.addCategory}
                      </Button>

                      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                        {resolvedCategories.map((category) => {
                          const isSelected = editingCategoryId === category.id || (categoryManagerMode !== 'create' && categoryForm.name === category.name);
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => openCategoryModal(category.id)}
                              className={cn(
                                'w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all text-left',
                                isSelected
                                  ? isDarkMode
                                    ? 'border-purple-500 bg-purple-500/10 text-purple-100'
                                    : 'border-purple-300 bg-purple-100 text-purple-700'
                                  : isDarkMode
                                    ? 'border-[color:var(--surface-border)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-purple-400/40'
                                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-purple-300/50 hover:bg-purple-50/70'
                              )}
                            >
                              <span
                                className={cn(
                                  'inline-flex h-8 w-8 items-center justify-center rounded-md overflow-hidden',
                                  isDarkMode ? 'bg-gray-800/80' : 'bg-slate-100'
                                )}
                              >
                                {renderIconValue(category.emoji, 'h-5 w-5 text-base') || '✨'}
                              </span>
                              <span className="truncate">{category.name}</span>
                              {category.source === 'default' && (
                                <span
                                  className="ml-auto text-xs uppercase tracking-wide"
                                  style={{ color: 'var(--text-tertiary)' }}
                                >
                                  {language === 'zh' ? '默认' : 'Default'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-2">
                          {t.categoryNameLabel}
                        </label>
                        <Input
                          value={categoryForm.name}
                          onChange={(e) => !isViewOnly && setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder={language === 'zh' ? '新的分类名称' : 'New category name'}
                          disabled={isViewOnly}
                          className={cn(
                            !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white focus-visible:shadow-[0_0_14px_rgba(168,85,247,0.1)]'
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'h-14 w-14 rounded-lg flex items-center justify-center text-2xl overflow-hidden border',
                              isDarkMode
                                ? 'border-gray-800 bg-gray-950 text-purple-300'
                                : 'border-slate-200 bg-white text-purple-600'
                            )}
                          >
                            {renderIconValue(categoryForm.emoji, 'h-10 w-10 text-3xl') || '⭐'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[color:var(--text-secondary)]">{t.categoryEmojiLabel}</p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {language === 'zh'
                                ? '从下方选项卡中选择图标，或输入自定义图标。'
                                : 'Pick an icon from the tabs below or provide your own.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {ICON_PICKER_TABS.map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => !isViewOnly && setIconPickerTab(tab.id)}
                              className={cn(
                                'px-3 py-1.5 text-xs rounded-full border transition-colors',
                                iconPickerTab === tab.id
                                  ? isDarkMode
                                    ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                                    : 'border-purple-300 bg-purple-100 text-purple-700'
                                  : isDarkMode
                                    ? 'border-[color:var(--surface-border)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-purple-400/40'
                                    : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-purple-300/50 hover:bg-purple-50/70',
                                isViewOnly && 'opacity-60 cursor-not-allowed'
                              )}
                              disabled={isViewOnly}
                            >
                              {tab.label[language as keyof typeof tab.label] ?? tab.label.en}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-4">
                          {iconPickerTab === 'emoji' && (
                            <Input
                              value={categoryForm.emoji}
                              onChange={(e) => !isViewOnly && setCategoryForm((prev) => ({ ...prev, emoji: e.target.value }))}
                              placeholder={language === 'zh' ? '输入 emoji 或字符' : 'Type an emoji or character'}
                              disabled={isViewOnly}
                              className={cn(
                                !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white'
                              )}
                            />
                          )}

                          {iconPickerTab === 'fontawesome' && (
                            <div className="space-y-3">
                              <Input
                                value={iconSearch}
                                onChange={(e) => setIconSearch(e.target.value)}
                                placeholder={language === 'zh' ? '搜索图标...' : 'Search icons...'}
                                disabled={isViewOnly}
                                className={cn(
                                  !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white'
                                )}
                              />
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {filteredFontAwesomeIcons.map((option) => {
                                  const isActive = categoryForm.emoji === `fa:${option.id}`;
                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => {
                                        if (isViewOnly) {
                                          return;
                                        }
                                        setCategoryForm((prev) => ({ ...prev, emoji: `fa:${option.id}` }));
                                      }}
                                      className={cn(
                                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors',
                                        isActive
                                          ? isDarkMode
                                            ? 'border-purple-500 bg-purple-500/20 text-purple-100'
                                            : 'border-purple-300 bg-purple-100 text-purple-700'
                                          : isDarkMode
                                            ? 'border-[color:var(--surface-border)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-purple-400/40'
                                            : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:border-purple-300/50 hover:bg-purple-50/70',
                                        isViewOnly && 'cursor-default opacity-50'
                                      )}
                                      disabled={isViewOnly}
                                    >
                                      <option.icon className="h-4 w-4" />
                                      <span className="truncate">{option.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {iconPickerTab === 'url' && (
                            <Input
                              value={categoryForm.emoji.startsWith('url:') ? categoryForm.emoji.slice(4) : categoryForm.emoji}
                              onChange={(e) => {
                                if (isViewOnly) {
                                  return;
                                }
                                const value = e.target.value.trim();
                                setCategoryForm((prev) => ({ ...prev, emoji: value ? (value.startsWith('http') ? value : `url:${value}`) : '' }));
                              }}
                              placeholder={language === 'zh' ? '粘贴图片链接' : 'Paste an image URL'}
                              disabled={isViewOnly}
                              className={cn(
                                !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white'
                              )}
                            />
                          )}

                          {iconPickerTab === 'upload' && (
                            <div className="space-y-3">
                              <input
                                ref={iconUploadInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleCategoryIconUpload}
                                disabled={isViewOnly}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  'flex items-center gap-2',
                                  isDarkMode
                                    ? 'border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                )}
                                onClick={() => {
                                  if (isViewOnly) {
                                    return;
                                  }
                                  iconUploadInputRef.current?.click();
                                }}
                                disabled={isViewOnly}
                              >
                                <UploadCloud className="h-4 w-4" />
                                <span>{language === 'zh' ? '上传自定义图标' : 'Upload custom icon'}</span>
                              </Button>
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {language === 'zh'
                                  ? '我们会将图像以 Base64 的形式保存在浏览器中。'
                                  : 'Images are stored locally as base64 data in your browser.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-6 flex items-center justify-between gap-3 pt-4 border-t"
                    style={{ borderColor: 'var(--surface-border)' }}
                  >
                    {categoryManagerMode === 'edit' && editingCategoryId && (
                      <Button
                        variant="ghost"
                        className="text-sm text-red-400 hover:text-red-300"
                        type="button"
                        onClick={() => handleDeleteCategory(editingCategoryId)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t.deleteCategory}
                      </Button>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          setShowCategoryModal(false);
                          resetCategoryForm();
                        }}
                        className={cn(
                          'transition-colors',
                          isDarkMode
                            ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                            : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5'
                        )}
                      >
                        {t.cancel}
                      </Button>
                      {categoryManagerMode !== 'view' && (
                        <Button
                          type="button"
                          onClick={handleSaveCategory}
                          className="px-5"
                        >
                          {t.save}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Create/Edit Template Modal */}
      <Dialog.Root
        open={isPremiumUser && showCreateModal}
        onOpenChange={(open) => {
          if (isPremiumUser) {
            setShowCreateModal(open);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50" />
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-8 z-50 overflow-y-auto shadow-2xl transition-colors"
            style={{ 
              width: '95vw', 
              maxWidth: '1152px', 
              height: '90vh',
              minHeight: '600px',
              background: 'var(--modal-surface-background)',
              border: '1px solid var(--modal-surface-border)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-semibold text-[color:var(--text-primary)]">
                {editingTemplate ? t.editPromptTemplate : t.createPromptTemplate}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 transition-colors',
                    isDarkMode
                      ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                      : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-black/5'
                  )}
                >
                  <X className="h-5 w-5" />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-6">
              {/* Template Icon/Preview */}
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    'w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border',
                    isDarkMode ? 'border-gray-800' : 'border-purple-200/60'
                  )}
                >
                  <span className={cn('text-4xl font-bold', isDarkMode ? 'text-purple-400' : 'text-purple-600')}>
                    {formData.name.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <label className="block text-base font-medium text-[color:var(--text-secondary)] mb-2">{t.name}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Anime (Copy)"
                    className={cn(
                      'w-full text-base py-3',
                      !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white focus-visible:shadow-[0_0_18px_rgba(168,85,247,0.12)]'
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-base font-medium text-[color:var(--text-secondary)] mb-2">
                  {t.descriptionOptional}
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t.briefDescription}
                  className={cn(
                    'w-full text-base py-3',
                    !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white'
                  )}
                />
              </div>

              {/* Category and Emoji */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-base font-medium text-[color:var(--text-secondary)] mb-2">
                    {t.templateCategoryLabel}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className={cn(
                      'w-full rounded-md px-4 py-3 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500',
                      isDarkMode
                        ? 'bg-[color:var(--surface-primary)] border-[color:var(--surface-border)] text-[color:var(--text-primary)]'
                        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    )}
                  >
                    <option value="">{t.uncategorized}</option>
                    {resolvedCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                          {`${getIconLabel(category.emoji)}${category.name}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-base font-medium text-[color:var(--text-secondary)] mb-2">
                    {t.templateEmojiLabel}
                  </label>
                  <Input
                    value={formData.emoji}
                    onChange={(e) => setFormData((prev) => ({ ...prev, emoji: e.target.value }))}
                    placeholder="🎨"
                    maxLength={8}
                    className={cn(
                      'w-full text-base py-3',
                      !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white'
                    )}
                  />
                </div>
              </div>

              {/* Representative Image */}
              <div>
                <label className="block text-base font-medium text-[color:var(--text-secondary)] mb-2">
                  {t.templateImageLabel}
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    value={formData.image}
                    onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                    placeholder={t.templateImageUrlPlaceholder}
                    className={cn(
                      'w-full sm:flex-1 text-base py-3',
                      !isDarkMode && 'bg-white/95 text-slate-900 border-slate-200 placeholder:text-slate-500 focus-visible:bg-white'
                    )}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'flex items-center gap-2 py-3 px-4 transition-colors',
                      isDarkMode
                        ? 'border-[color:var(--surface-border)] bg-[color:var(--surface-secondary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                        : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="h-5 w-5" />
                    <span>{t.templateImageUpload}</span>
                  </Button>
                </div>
                {formData.image && (
                  <div className="mt-3 flex items-center gap-4">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className={cn(
                        'h-24 w-24 rounded-md object-cover transition-colors',
                        isDarkMode ? 'border border-gray-800' : 'border border-purple-200/70'
                      )}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-sm transition-colors',
                        isDarkMode
                          ? 'text-[color:var(--text-tertiary)] hover:text-red-300'
                          : 'text-slate-500 hover:text-red-500'
                      )}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
                    >
                      {t.templateImageClear}
                    </Button>
                  </div>
                )}
              </div>

              {/* Positive Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-medium text-[color:var(--text-secondary)]">
                    {t.positivePrompt}
                  </label>
                  <button
                    onClick={() => {
                      const cursorPos = document.querySelector<HTMLTextAreaElement>('[data-field="positivePrompt"]')?.selectionStart || formData.positivePrompt.length;
                      const before = formData.positivePrompt.substring(0, cursorPos);
                      const after = formData.positivePrompt.substring(cursorPos);
                      setFormData(prev => ({ ...prev, positivePrompt: before + '{prompt}' + after }));
                    }}
                    className={cn(
                      'text-sm transition-colors',
                      isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'
                    )}
                  >
                    {t.insertPlaceholder}
                  </button>
                </div>
                <Textarea
                  value={formData.positivePrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, positivePrompt: e.target.value }))}
                  placeholder="{prompt} anime++, bold outline, cel-shaded coloring, shounen, seinen"
                  className={cn(
                    'w-full min-h-[120px] text-base transition-colors',
                    isDarkMode
                      ? 'bg-[color:var(--surface-primary)] border-[color:var(--surface-border)] text-[color:var(--text-primary)] focus-visible:ring-1 focus-visible:ring-purple-500/70'
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-purple-400'
                  )}
                  data-field="positivePrompt"
                />
                <p className={cn('text-sm mt-2', isDarkMode ? 'text-[color:var(--text-tertiary)]' : 'text-slate-600')}>
                  {t.usePlaceholder.replace('{prompt}', '')}
                  <code
                    className={cn(
                      'px-2 py-1 rounded text-sm',
                      isDarkMode ? 'bg-gray-800 text-[color:var(--text-primary)]' : 'bg-slate-200 text-slate-900'
                    )}
                  >
                    {'{prompt}'}
                  </code>
                  {t.usePlaceholder.split('{prompt}')[1]}
                </p>
              </div>

              {/* Negative Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-medium text-[color:var(--text-secondary)]">
                    {t.negativePrompt}
                  </label>
                  <button
                    onClick={() => {
                      const cursorPos = document.querySelector<HTMLTextAreaElement>('[data-field="negativePrompt"]')?.selectionStart || formData.negativePrompt.length;
                      const before = formData.negativePrompt.substring(0, cursorPos);
                      const after = formData.negativePrompt.substring(cursorPos);
                      setFormData(prev => ({ ...prev, negativePrompt: before + '{prompt}' + after }));
                    }}
                    className={cn(
                      'text-sm transition-colors',
                      isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'
                    )}
                  >
                    {t.insertPlaceholder}
                  </button>
                </div>
                <Textarea
                  value={formData.negativePrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, negativePrompt: e.target.value }))}
                  placeholder="{photo}+++, greyscale, solid black, painting"
                  className={cn(
                    'w-full min-h-[120px] text-base transition-colors',
                    isDarkMode
                      ? 'bg-[color:var(--surface-primary)] border-[color:var(--surface-border)] text-[color:var(--text-primary)] focus-visible:ring-1 focus-visible:ring-purple-500/70'
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-purple-400'
                  )}
                  data-field="negativePrompt"
                />
              </div>

              {/* Info Text */}
              <div
                className={cn(
                  'text-sm space-y-2 rounded-lg p-4 transition-colors',
                  isDarkMode
                    ? 'bg-black/40 border border-gray-800 text-[color:var(--text-secondary)]'
                    : 'bg-purple-50/70 border border-purple-200 text-slate-700'
                )}
              >
                <p>{t.templateExplanation}</p>
                <p>
                  {t.templateOmitPlaceholder}
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[color:var(--surface-border)]">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className={cn(
                    'px-6 py-3 text-base transition-colors',
                    isDarkMode
                      ? 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
                  )}
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  className={cn(
                    'px-6 py-3 text-base transition-colors',
                    isDarkMode
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_12px_30px_-12px_rgba(168,85,247,0.45)]'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_14px_34px_-18px_rgba(168,85,247,0.55)]'
                  )}
                >
                  {t.save}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
