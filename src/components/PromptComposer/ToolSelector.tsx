import React from 'react';
import { Wand2, Edit3, MousePointer, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

type Tool = 'generate' | 'edit' | 'mask';

interface ToolSelectorProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  onShowHints: () => void;
  t: any;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  selectedTool,
  onToolChange,
  onShowHints,
  t,
}) => {
  const tools = [
    { id: 'generate' as const, icon: Wand2, label: t.generate, description: t.createFromText },
    { id: 'edit' as const, icon: Edit3, label: t.edit, description: t.modifyExisting },
    { id: 'mask' as const, icon: MousePointer, label: t.select, description: t.clickToSelect },
  ];

  return (
    <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">{t.selectMode}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{t.chooseHowToCreate}</p>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowHints}
            className="h-7 w-7 hover:bg-gray-800"
            title={t.promptTips}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={cn(
              'flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 group relative overflow-hidden',
              selectedTool === tool.id
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
            )}
          >
            {selectedTool === tool.id && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse" />
            )}
            <tool.icon
              className={cn(
                'h-5 w-5 mb-2 relative z-10 transition-colors',
                selectedTool === tool.id ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-300'
              )}
            />
            <span
              className={cn(
                'text-xs font-semibold relative z-10 transition-colors',
                selectedTool === tool.id ? 'text-purple-300' : 'text-gray-400 group-hover:text-gray-300'
              )}
            >
              {tool.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
