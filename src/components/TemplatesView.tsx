import React from 'react';
import { useAppStore } from '../store/useAppStore';
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
  Eye,
  X,
  Layers
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getTranslation } from '../i18n/translations';

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

export interface PromptTemplate {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  positivePrompt: string;
  negativePrompt: string;
  description?: string;
  isDefault?: boolean;
  createdAt: number;
}

export const getDefaultTemplates = (language: string): PromptTemplate[] => {
  const isZh = language === 'zh';
  
  return [
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
    emoji: '�️',
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
    emoji: '�',
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
};

export const DEFAULT_TEMPLATES: PromptTemplate[] = getDefaultTemplates('en');

interface TemplatesViewProps {
  onTemplateSelect?: (templateInfo: { name: string; image?: string; emoji?: string } | null) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onTemplateSelect }) => {
  const { 
    currentPrompt,
    setCurrentPrompt, 
    selectedTemplate, 
    setSelectedTemplate, 
    language,
    customTemplates,
    addCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate
  } = useAppStore();
  const t = getTranslation(language);
  
  // Get localized default templates
  const localizedDefaultTemplates = React.useMemo(() => getDefaultTemplates(language), [language]);
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    my: true,
    default: true,
  });
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<PromptTemplate | null>(null);
  
  // Form state for create/edit modal
  const [formData, setFormData] = React.useState({
    name: '',
    positivePrompt: '',
    negativePrompt: '',
    description: '',
    image: '',
  });

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
    setFormData({
      name: '',
      positivePrompt: '',
      negativePrompt: '',
      description: '',
      image: '',
    });
    setEditingTemplate(null);
    setShowCreateModal(true);
  };

  const openEditModal = (template: PromptTemplate) => {
    setFormData({
      name: template.name,
      positivePrompt: template.positivePrompt,
      negativePrompt: template.negativePrompt,
      description: template.description || '',
      image: template.image || '',
    });
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  const openDuplicateModal = (template: PromptTemplate) => {
    setFormData({
      name: `${template.name} (Copy)`,
      positivePrompt: template.positivePrompt,
      negativePrompt: template.negativePrompt,
      description: template.description || '',
      image: template.image || '',
    });
    setEditingTemplate(null);
    setShowCreateModal(true);
  };

  const handleApplyTemplate = (template: PromptTemplate) => {
    const basePrompt = currentPrompt?.trim() || '';

    // Replace placeholders when present; otherwise append template text after existing prompt
    const positiveWithPrompt = template.positivePrompt.includes('{prompt}')
      ? template.positivePrompt.replace('{prompt}', basePrompt)
      : [basePrompt, template.positivePrompt].filter(Boolean).join(basePrompt ? '\n\n' : '');

    const cleanedPositive = positiveWithPrompt
      .replace('{photo}', '')
      .trim();

    let finalPrompt = cleanedPositive;

    if (template.negativePrompt && template.negativePrompt.trim()) {
      const negativeBase = template.negativePrompt.includes('{prompt}')
        ? template.negativePrompt.replace('{prompt}', basePrompt)
        : template.negativePrompt;

      const cleanedNegative = negativeBase.replace('{photo}', '').trim();
      if (cleanedNegative) {
        finalPrompt = [cleanedPositive, `Negative prompt: ${cleanedNegative}`]
          .filter(Boolean)
          .join('\n\n');
      }
    }

    setCurrentPrompt(finalPrompt);

    // Clear active template state after flattening
    setSelectedTemplate(null);

    if (onTemplateSelect) {
      onTemplateSelect(null);
    }
  };

  const handleSaveTemplate = () => {
    if (!formData.name.trim() || !formData.positivePrompt.trim()) {
      alert('Please enter a name and positive prompt');
      return;
    }

    if (editingTemplate) {
      // Update existing template
      updateCustomTemplate(editingTemplate.id, {
        name: formData.name.trim(),
        positivePrompt: formData.positivePrompt.trim(),
        negativePrompt: formData.negativePrompt.trim(),
        description: formData.description.trim(),
        image: formData.image.trim() || undefined,
      });
    } else {
      // Create new template
      const newTemplate: PromptTemplate = {
        id: `custom-${Date.now()}`,
        name: formData.name.trim(),
        positivePrompt: formData.positivePrompt.trim(),
        negativePrompt: formData.negativePrompt.trim(),
        description: formData.description.trim(),
        image: formData.image.trim() || undefined,
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

  const filteredMyTemplates = customTemplates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDefaultTemplates = localizedDefaultTemplates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTemplateCard = (template: PromptTemplate, isCustom: boolean) => (
    <div
      key={template.id}
      className={cn(
        "group relative bg-gray-900 rounded-lg border transition-all overflow-visible text-left w-full cursor-pointer",
        selectedTemplate === template.id 
          ? "border-purple-500 bg-purple-500/10" 
          : "border-gray-800 hover:border-gray-700"
      )}
    >
      {/* Main card content */}
      <div 
        className="flex items-center gap-3 p-3"
        onClick={() => {
          setSelectedTemplate(template.id);
          // Update parent component with template info
          if (onTemplateSelect) {
            onTemplateSelect({
              name: template.name,
              image: template.image,
              emoji: template.emoji
            });
          }
        }}
      >
        {/* Template Thumbnail */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border border-gray-800 overflow-hidden">
          {template.image ? (
            <img 
              src={template.image} 
              alt={template.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const firstLetter = template.name.charAt(0).toUpperCase();
                e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl font-bold text-purple-400">${firstLetter}</span>`;
              }}
            />
          ) : template.emoji ? (
            <span className="text-2xl">{template.emoji}</span>
          ) : (
            <span className="text-2xl font-bold text-purple-400">
              {template.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Template Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-200 mb-0.5">{template.name}</h4>
            {selectedTemplate === template.id && (
              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                Active
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-xs text-gray-500 line-clamp-1">{template.description}</p>
          )}
        </div>

        {/* Template Action Icons - Show when active */}
        {selectedTemplate === template.id ? (
          <div className="flex-shrink-0 flex items-center gap-1">
            {/* View/Preview Icon */}
          

    

         
          </div>
        ) : (
          /* Custom Template Actions - Show on hover when not active */
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
              onClick={(e) => {
                e.stopPropagation();
                openDuplicateModal(template);
              }}
              title="Duplicate template"
            >
              <Copy className="h-3 w-3" />
            </Button>
            {isCustom && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(template);
                  }}
                  title="Edit template"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  title="Delete template"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>


      
      {/* Image Preview on Hover */}
      {template.image && (
        <div className="absolute left-full ml-2 top-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-2xl">
            <img 
              src={template.image} 
              alt={template.name}
              className="w-48 h-48 object-cover rounded"
              onError={(e) => {
                e.currentTarget.parentElement!.style.display = 'none';
              }}
            />
            <p className="text-xs text-gray-400 mt-2 text-center">{template.name}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* Search and Actions */}
      <div className="flex-shrink-0 mb-3 space-y-2">
        <Input
          type="text"
          placeholder="Search by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={openCreateModal}
            title={t.createTemplate}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-3">
        {/* My Templates Section */}
        <div>
          <button
            onClick={() => toggleSection('my')}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              {expandedSections.my ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
              <h3 className="text-sm font-semibold text-gray-300">My Templates</h3>
            </div>
            <span className="text-xs text-gray-500">{customTemplates.length}</span>
          </button>

          {expandedSections.my && (
            <div className="mt-2">
              {filteredMyTemplates.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  {searchQuery ? 'No matching templates' : 'No templates yet. Create one to get started.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredMyTemplates.map(template => renderTemplateCard(template, true))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Default Templates Section */}
        <div>
          <button
            onClick={() => toggleSection('default')}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              {expandedSections.default ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
              <h3 className="text-sm font-semibold text-gray-300">Default Templates</h3>
            </div>
            <span className="text-xs text-gray-500">{localizedDefaultTemplates.length}</span>
          </button>

          {expandedSections.default && (
            <div className="mt-2">
              {filteredDefaultTemplates.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  No matching templates
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredDefaultTemplates.map(template => renderTemplateCard(template, false))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Template Modal */}
      <Dialog.Root open={showCreateModal} onOpenChange={setShowCreateModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-100">
                {editingTemplate ? t.editPromptTemplate : t.createPromptTemplate}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {/* Template Icon/Preview */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border border-gray-800">
                  <span className="text-3xl font-bold text-purple-400">
                    {formData.name.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">{t.name}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Anime (Copy)"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t.descriptionOptional}
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t.briefDescription}
                  className="w-full"
                />
              </div>

              {/* Image URL - Hidden to show only emoji icons */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Thumbnail Image URL (Optional)
                </label>
                <Input
                  value={formData.image || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full"
                />
                {formData.image && (
                  <div className="mt-2 flex items-center gap-2">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-12 h-12 object-cover rounded border border-gray-700"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-xs text-gray-500">Preview</span>
                  </div>
                )}
              </div> */}

              {/* Positive Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-300">
                    {t.positivePrompt}
                  </label>
                  <button
                    onClick={() => {
                      const cursorPos = document.querySelector<HTMLTextAreaElement>('[data-field="positivePrompt"]')?.selectionStart || formData.positivePrompt.length;
                      const before = formData.positivePrompt.substring(0, cursorPos);
                      const after = formData.positivePrompt.substring(cursorPos);
                      setFormData(prev => ({ ...prev, positivePrompt: before + '{prompt}' + after }));
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {t.insertPlaceholder}
                  </button>
                </div>
                <Textarea
                  value={formData.positivePrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, positivePrompt: e.target.value }))}
                  placeholder="{prompt} anime++, bold outline, cel-shaded coloring, shounen, seinen"
                  className="w-full min-h-[80px]"
                  data-field="positivePrompt"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t.usePlaceholder.replace('{prompt}', '')}
                  <code className="px-1 py-0.5 bg-gray-800 rounded">{'{prompt}'}</code>
                  {t.usePlaceholder.split('{prompt}')[1]}
                </p>
              </div>

              {/* Negative Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-300">
                    {t.negativePrompt}
                  </label>
                  <button
                    onClick={() => {
                      const cursorPos = document.querySelector<HTMLTextAreaElement>('[data-field="negativePrompt"]')?.selectionStart || formData.negativePrompt.length;
                      const before = formData.negativePrompt.substring(0, cursorPos);
                      const after = formData.negativePrompt.substring(cursorPos);
                      setFormData(prev => ({ ...prev, negativePrompt: before + '{prompt}' + after }));
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {t.insertPlaceholder}
                  </button>
                </div>
                <Textarea
                  value={formData.negativePrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, negativePrompt: e.target.value }))}
                  placeholder="{photo}+++, greyscale, solid black, painting"
                  className="w-full min-h-[80px]"
                  data-field="negativePrompt"
                />
              </div>

              {/* Info Text */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>{t.templateExplanation}</p>
                <p>
                  {t.templateOmitPlaceholder}
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  className="bg-gray-700 hover:bg-gray-600"
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
