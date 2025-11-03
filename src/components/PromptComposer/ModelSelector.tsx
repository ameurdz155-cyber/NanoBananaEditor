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
  React.useEffect(() => {
    if (modelName === 'gemini-2.5-flash-image-preview') {
      onModelFamilyChange('gemini');
      onModelNameChange('models/gemini-2.5-flash-image');
    }
  }, [modelName, onModelFamilyChange, onModelNameChange]);

  // Create combined list of all available models
  const allModels = React.useMemo(() => {
    const models: Array<{ value: string; label: string; family: ModelFamily }> = [];

    // Only Gemini 2.5 Flash
    models.push({
      value: 'models/gemini-2.5-flash-image',
      label: `${t.modelOptionGemini} - models/gemini-2.5-flash-image`,
      family: 'gemini',
    });

    // Only Imagen 3
    models.push({
      value: 'imagen-3.0-002',
      label: `${t.modelOptionImagen} - imagen-3.0-002`,
      family: 'imagen',
    });
    
    return models;
  }, [t.modelOptionGemini, t.modelOptionImagen]);

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
