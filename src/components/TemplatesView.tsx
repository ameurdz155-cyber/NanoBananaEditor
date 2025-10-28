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
  Upload,
  Download,
  EyeOff,
  Eye,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getTranslation } from '../i18n/translations';

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

export const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'anime',
    name: 'Anime',
    emoji: '🎨',
    image: 'https://api.invoke.ai/style-presets/cfe2cdc4-0e24-40ad-9bdd-60782655cdc2/image?hash=1761586375.1477022',
    description: 'Anime style with bold outlines and cel-shaded coloring',
    positivePrompt: '{prompt} anime++, bold outline, cel-shaded coloring, shounen, seinen',
    negativePrompt: '{photo}+++, greyscale, solid black, painting',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'concept-art-fantasy',
    name: 'Concept Art (Fantasy)',
    emoji: '🐉',
    image: 'https://api.invoke.ai/style-presets/753a712d-4448-47af-8d0d-90d265d540bb/image?hash=1761586375.1477315',
    description: 'Fantasy concept art with magical atmosphere',
    positivePrompt: '{prompt} fantasy concept art, magical atmosphere, detailed environment, epic scale',
    negativePrompt: 'modern, realistic, photo, contemporary',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'photography-portrait',
    name: 'Photography (Portrait)',
    emoji: '📸',
    image: 'https://api.invoke.ai/style-presets/aedddd51-d5b1-4e49-8db5-13de20d1a6ec/image?hash=1761586375.147768',
    description: 'Professional portrait photography with studio lighting',
    positivePrompt: '{prompt} portrait photography, professional lighting, bokeh background, sharp focus',
    negativePrompt: 'illustration, painting, drawing, cartoon, anime',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'illustration',
    name: 'Illustration',
    emoji: '🖼️',
    image: 'https://api.invoke.ai/style-presets/71e23df6-99a0-4cab-9b30-9a9c062ac98d/image?hash=1761586375.1477463',
    description: 'Digital illustration with vibrant colors',
    positivePrompt: '{prompt} digital illustration, vibrant colors, stylized, artistic',
    negativePrompt: 'photo, realistic, 3d render',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'architectural',
    name: 'Architectural Visualization',
    emoji: '🏛️',
    image: 'https://api.invoke.ai/style-presets/b6a16050-6510-4271-aa32-40a99f25a8af/image?hash=1761586375.147722',
    description: 'Professional architectural renders',
    positivePrompt: '{prompt} architectural visualization, professional render, clean lines, modern design',
    negativePrompt: 'sketch, hand-drawn, blurry, low quality',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'concept-art-scifi',
    name: 'Concept Art (Sci-Fi)',
    emoji: '🚀',
    image: 'https://api.invoke.ai/style-presets/7f884df7-1d2c-4aa2-be99-ebf4099ec4c7/image?hash=1761586375.147739',
    description: 'Futuristic sci-fi concept art',
    positivePrompt: '{prompt} sci-fi concept art, futuristic, advanced technology, cinematic',
    negativePrompt: 'medieval, fantasy, historical, vintage',
    isDefault: true,
    createdAt: Date.now(),
  },
];

interface TemplatesViewProps {
  onTemplateSelect?: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onTemplateSelect }) => {
  const { setCurrentPrompt, selectedTemplate, setSelectedTemplate, language } = useAppStore();
  const t = getTranslation(language);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [myTemplates, setMyTemplates] = React.useState<PromptTemplate[]>([]);
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    my: true,
    default: true,
  });
  const [showPreviews, setShowPreviews] = React.useState(true);
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
    // Just activate the template, don't modify the current prompt
    setSelectedTemplate(template.id);
    // Clear the prompt so user can enter their custom text
    setCurrentPrompt('');
    // Close the templates panel
    if (onTemplateSelect) {
      onTemplateSelect();
    }
  };

  const handleSaveTemplate = () => {
    if (!formData.name.trim() || !formData.positivePrompt.trim()) {
      alert('Please enter a name and positive prompt');
      return;
    }

    if (editingTemplate) {
      // Update existing template
      setMyTemplates(prev =>
        prev.map(t =>
          t.id === editingTemplate.id
            ? {
                ...t,
                name: formData.name.trim(),
                positivePrompt: formData.positivePrompt.trim(),
                negativePrompt: formData.negativePrompt.trim(),
                description: formData.description.trim(),
                image: formData.image.trim() || undefined,
              }
            : t
        )
      );
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
      setMyTemplates(prev => [newTemplate, ...prev]);
    }

    setShowCreateModal(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setMyTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const handleImportTemplates = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = JSON.parse(content);
          if (Array.isArray(imported)) {
            setMyTemplates(prev => [...imported, ...prev]);
          }
        } catch (error) {
          alert('Failed to import templates. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportTemplates = () => {
    if (myTemplates.length === 0) {
      alert('No templates to export');
      return;
    }

    const dataStr = JSON.stringify(myTemplates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-templates-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredMyTemplates = myTemplates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDefaultTemplates = DEFAULT_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTemplateCard = (template: PromptTemplate, isCustom: boolean) => (
    <button
      key={template.id}
      onClick={() => handleApplyTemplate(template)}
      className={cn(
        "group relative bg-gray-900 rounded-lg border transition-all overflow-visible text-left w-full",
        selectedTemplate === template.id 
          ? "border-purple-500 bg-purple-500/10" 
          : "border-gray-800 hover:border-gray-700"
      )}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Template Thumbnail */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center text-2xl border border-gray-800 overflow-hidden">
          {template.image ? (
            <img 
              src={template.image} 
              alt={template.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = template.emoji || '📝';
              }}
            />
          ) : (
            template.emoji || '📝'
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

        {/* Actions */}
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
    </button>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
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
            onClick={() => setShowPreviews(!showPreviews)}
            title={showPreviews ? "Hide Previews" : "Show Previews"}
            className="h-8 w-8"
          >
            {showPreviews ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={openCreateModal}
            title="Create Template"
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleImportTemplates}
            title="Import Templates"
            className="h-8 w-8"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportTemplates}
            disabled={myTemplates.length === 0}
            title="Export Templates"
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
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
            <span className="text-xs text-gray-500">{myTemplates.length}</span>
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
            <span className="text-xs text-gray-500">{DEFAULT_TEMPLATES.length}</span>
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
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center text-3xl border border-gray-800">
                  {formData.name.charAt(0).toUpperCase() || '📝'}
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
