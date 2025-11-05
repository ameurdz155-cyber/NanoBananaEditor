import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../utils/cn';
import { getTranslation, type Translations } from '../i18n/translations';

const UpscalingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 256 256"
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M140 88a12 12 0 0 1 12-12h32a12 12 0 0 1 12 12v32a12 12 0 0 1-24 0V100H152A12 12 0 0 1 140 88ZM72 180h32a12 12 0 0 0 0-24H84V136a12 12 0 0 0-24 0v32A12 12 0 0 0 72 180ZM236 56V200a20 20 0 0 1-20 20H40a20 20 0 0 1-20-20V56A20 20 0 0 1 40 36H216A20 20 0 0 1 236 56Zm-24 4H44V196H212Z" />
  </svg>
);

const navItems: Array<{
  key: 'generate' | 'canvas' | 'upscaling' | 'workflows';
  icon: React.ComponentType<{ className?: string }>;
  translationKey: keyof Translations;
  fallback: string;
}> = [
  { key: 'generate', icon: Sparkles, translationKey: 'generate', fallback: 'Generate' },
  { key: 'upscaling', icon: UpscalingIcon, translationKey: 'upscalingTab', fallback: 'Upscaling' },
  // { key: 'workflows', icon: Workflow, translationKey: 'workflowsTab', fallback: 'Workflows' },
];

export const SideNavigation: React.FC = () => {
  // Temporary flag to hide the navigation bar entirely
  const showNavigation = false;
  if (!showNavigation) {
    return null;
  }

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
