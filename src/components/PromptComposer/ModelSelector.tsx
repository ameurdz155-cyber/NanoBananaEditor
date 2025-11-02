import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

type ModelFamily = 'gemini' | 'imagen';

interface ModelSelectorProps {
  modelFamily: ModelFamily;
  modelName: string;
  availableImagenModels: string[];
  isLoadingModels: boolean;
  modelLoadError: string | null;
  onModelFamilyChange: (family: ModelFamily) => void;
  onModelNameChange: (name: string) => void;
  t: any;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  modelFamily,
  modelName,
  availableImagenModels,
  isLoadingModels,
  modelLoadError,
  onModelFamilyChange,
  onModelNameChange,
  t,
}) => {
  // Create combined list of all available models
  const allModels = React.useMemo(() => {
    const models: Array<{ value: string; label: string; family: ModelFamily }> = [];
    
    // Add Gemini model
    models.push({
      value: modelName || 'gemini-2.5-flash-image-preview',
      label: `${t.modelOptionGemini} - ${modelName || 'gemini-2.5-flash-image-preview'}`,
      family: 'gemini',
    });
    
    // Add Imagen models
    if (availableImagenModels.length > 0) {
      availableImagenModels.forEach((model) => {
        models.push({
          value: model,
          label: `${t.modelOptionImagen} - ${model}`,
          family: 'imagen',
        });
      });
    }
    
    return models;
  }, [modelName, availableImagenModels, t.modelOptionGemini, t.modelOptionImagen]);

  const currentSelection = React.useMemo(() => {
    return allModels.find(
      (m) => m.family === modelFamily && m.value === modelName
    ) || allModels[0];
  }, [allModels, modelFamily, modelName]);

  const handleModelChange = (value: string) => {
    const selected = allModels.find((m) => m.value === value);
    if (selected) {
      onModelFamilyChange(selected.family);
      onModelNameChange(selected.value);
    }
  };

  return (
    <div className="flex-shrink-0">
      <label className="text-xs font-semibold text-gray-300 mb-2 block">
        {t.modelSelection || 'Model Selection'}
      </label>
      <div className="relative">
        <select
          value={currentSelection?.value || ''}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={isLoadingModels}
          className={cn(
            'w-full h-10 px-3 pr-10 bg-gray-900/80 border border-gray-700/60 rounded-lg text-sm text-gray-100',
            'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 focus:outline-none transition-all',
            'appearance-none cursor-pointer',
            isLoadingModels && 'opacity-50 cursor-not-allowed'
          )}
        >
          {allModels.map((model) => (
            <option key={`${model.family}-${model.value}`} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        {isLoadingModels && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="h-3 w-3 animate-spin rounded-full border border-purple-500/40 border-t-transparent" />
          </div>
        )}
      </div>
      {modelLoadError && (
        <p className="text-xs text-red-400 mt-1">{modelLoadError}</p>
      )}
    </div>
  );
};
