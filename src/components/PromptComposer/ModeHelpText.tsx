import React from 'react';
import { Sparkles, Edit3, MousePointer } from 'lucide-react';

interface ModeHelpTextProps {
  selectedTool: 'generate' | 'edit' | 'mask';
  t: any;
}

export const ModeHelpText: React.FC<ModeHelpTextProps> = ({ selectedTool, t }) => {
  return (
    <div className="mb-3 p-3 bg-[#20222c] border border-gray-800/80 rounded-lg">
      {selectedTool === 'generate' && (
        <div className="space-y-1.5">
          <p className="text-xs text-cyan-400 font-medium flex items-center">
            <Sparkles className="h-3 w-3 mr-1.5" />
            {t.generateModeTitle}
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">{t.generateModeDescription}</p>
          <p className="text-xs text-purple-400 italic">{t.generateModeTip}</p>
        </div>
      )}

      {selectedTool === 'edit' && (
        <div className="space-y-1.5">
          <p className="text-xs text-cyan-400 font-medium flex items-center">
            <Edit3 className="h-3 w-3 mr-1.5" />
            {t.editModeTitle}
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">{t.editModeDescription}</p>
        </div>
      )}

      {selectedTool === 'mask' && (
        <div className="space-y-1.5">
          <p className="text-xs text-cyan-400 font-medium flex items-center">
            <MousePointer className="h-3 w-3 mr-1.5" />
            {t.selectModeTitle}
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">{t.selectModeDescription}</p>
          <p className="text-xs text-orange-400">{t.selectModeWarning}</p>
        </div>
      )}
    </div>
  );
};
