import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Dialog } from '@radix-ui/react-dialog';
import { Plus, X, UploadCloud, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
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

interface DisplayCategory {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  source: 'default' | 'custom';
}

type IconPickerTab = 'emoji' | 'fontawesome' | 'url' | 'upload';

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

const ICON_PICKER_TABS: Array<{ id: IconPickerTab; label: { en: string; zh: string } }> = [
  { id: 'emoji', label: { en: 'Emoji', zh: '表情符号' } },
  { id: 'fontawesome', label: { en: 'Font Awesome', zh: 'Font Awesome' } },
  { id: 'url', label: { en: 'Image URL', zh: '图片链接' } },
  { id: 'upload', label: { en: 'Upload', zh: '上传图标' } },
];

interface CategoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: DisplayCategory[];
  categoryForm: { name: string; emoji: string };
  onCategoryFormChange: (form: { name: string; emoji: string }) => void;
  iconPickerTab: IconPickerTab;
  onIconPickerTabChange: (tab: IconPickerTab) => void;
  iconSearch: string;
  onIconSearchChange: (search: string) => void;
  categoryManagerMode: 'create' | 'edit' | 'view';
  editingCategoryId: string | null;
  onOpenCategoryModal: (categoryId?: string) => void;
  onSaveCategory: () => void;
  onDeleteCategory: (categoryId: string) => void;
  onResetCategoryForm: () => void;
  onCategoryIconUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  iconUploadInputRef: React.RefObject<HTMLInputElement>;
  isDarkMode: boolean;
  language: string;
  t: any; // Translation object
  renderIconValue: (value?: string, className?: string) => React.ReactNode;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onOpenChange,
  categories,
  categoryForm,
  onCategoryFormChange,
  iconPickerTab,
  onIconPickerTabChange,
  iconSearch,
  onIconSearchChange,
  categoryManagerMode,
  editingCategoryId,
  onOpenCategoryModal,
  onSaveCategory,
  onDeleteCategory,
  onResetCategoryForm,
  onCategoryIconUpload,
  iconUploadInputRef,
  isDarkMode,
  language,
  t,
  renderIconValue,
}) => {
  const isViewOnly = categoryManagerMode === 'view';

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

  const modalTitle = categoryManagerMode === 'edit'
    ? language === 'zh' ? '编辑分类' : 'Edit Category'
    : categoryManagerMode === 'view'
      ? language === 'zh' ? '查看分类' : 'View Category'
      : t.addCategory;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={onOpenChange}
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
                    onResetCategoryForm();
                    onOpenChange(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addCategory}
                </Button>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                  {categories.map((category) => {
                    const isSelected = editingCategoryId === category.id || (categoryManagerMode !== 'create' && categoryForm.name === category.name);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => onOpenCategoryModal(category.id)}
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
                    onChange={(e) => !isViewOnly && onCategoryFormChange({ ...categoryForm, name: e.target.value })}
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
                        onClick={() => !isViewOnly && onIconPickerTabChange(tab.id)}
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
                        onChange={(e) => !isViewOnly && onCategoryFormChange({ ...categoryForm, emoji: e.target.value })}
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
                          onChange={(e) => onIconSearchChange(e.target.value)}
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
                                  onCategoryFormChange({ ...categoryForm, emoji: `fa:${option.id}` });
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
                          onCategoryFormChange({ ...categoryForm, emoji: value ? (value.startsWith('http') ? value : `url:${value}`) : '' });
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
                          onChange={onCategoryIconUpload}
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
                  onClick={() => onDeleteCategory(editingCategoryId)}
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
                    onOpenChange(false);
                    onResetCategoryForm();
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
                    onClick={onSaveCategory}
                    className="px-5"
                  >
                    {t.save}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};