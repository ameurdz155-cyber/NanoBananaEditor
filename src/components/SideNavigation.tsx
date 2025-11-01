import React from 'react';
import { Sparkles, LayoutDashboard, ArrowUpCircle, Workflow } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../utils/cn';
import { getTranslation, type Translations } from '../i18n/translations';

const navItems: Array<{
  key: 'generate' | 'canvas' | 'upscaling' | 'workflows';
  icon: React.ComponentType<{ className?: string }>;
  translationKey: keyof Translations;
  fallback: string;
}> = [
  { key: 'generate', icon: Sparkles, translationKey: 'generate', fallback: 'Generate' },
  { key: 'canvas', icon: LayoutDashboard, translationKey: 'canvasTab', fallback: 'Canvas' },
  { key: 'upscaling', icon: ArrowUpCircle, translationKey: 'upscalingTab', fallback: 'Upscaling' },
  { key: 'workflows', icon: Workflow, translationKey: 'workflowsTab', fallback: 'Workflows' },
];

export const SideNavigation: React.FC = () => {
  const activePrimarySection = useAppStore((state) => state.activePrimarySection);
  const setActivePrimarySection = useAppStore((state) => state.setActivePrimarySection);
  const setSelectedTool = useAppStore((state) => state.setSelectedTool);
  const language = useAppStore((state) => state.language);

  const t = getTranslation(language);

  const handleSelect = (section: typeof navItems[number]['key']) => {
    setActivePrimarySection(section);

    if (section === 'generate') {
      setSelectedTool('generate');
    }
  };

  return (
    <nav
      data-theme="dark"
      className="flex flex-col items-center gap-4 py-6 px-2 border-r border-gray-800 bg-gray-950/95"
      style={{ width: '64px' }}
      aria-label="Primary navigation"
    >
      {navItems.map(({ key, icon: Icon, translationKey, fallback }) => {
        const label = t[translationKey] ?? fallback;
        const selected = activePrimarySection === key;

        return (
          <button
            key={key}
            type="button"
            aria-label={label}
            data-selected={selected}
            data-testid={fallback}
            onClick={() => handleSelect(key)}
            aria-pressed={selected}
            className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-gray-200 hover:bg-gray-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 border border-transparent',
              selected && 'bg-lime-400/15 text-lime-300 shadow-[0_10px_24px_-18px_rgba(190,242,100,0.9)] border border-lime-400/40'
            )}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </nav>
  );
};
