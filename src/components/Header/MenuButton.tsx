import React, { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';
import { Separator } from '../ui/Separator';
import {
  Menu,
  LogOut,
  BookOpen,
  Users,
  Package,
  Wallet,
  Settings,
  HelpCircle,
  FolderTree,
  FileText,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface MenuButtonProps {
  isDarkMode: boolean;
  language: string;
  user: { username: string } | null;
  translations: {
    menuPromptCategories: string;
    menuTemplateManagement: string;
    menuTutorials: string;
    menuCommunity: string;
    menuAssets: string;
    menuWallet: string;
    settings: string;
    about: string;
  };
  onCategoryClick: () => void;
  onTemplateClick: () => void;
  onSettingsClick: () => void;
  onInfoClick: () => void;
  onLogout: () => void;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  isDarkMode,
  language,
  user,
  translations,
  onCategoryClick,
  onTemplateClick,
  onSettingsClick,
  onInfoClick,
  onLogout,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updateMenuPosition = useCallback(() => {
    if (!menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    const width = 208; // ~w-52 in pixels
    setMenuPosition({
      top: rect.bottom + 8,
      left: Math.max(16, rect.right - width),
    });
  }, []);

  useEffect(() => {
    if (!showMenu) {
      return;
    }

    updateMenuPosition();
    const handleResize = () => updateMenuPosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showMenu, updateMenuPosition]);

  const menuContainerClasses = cn(
    'fixed w-52 rounded-xl border shadow-2xl overflow-hidden backdrop-blur-md transition-colors',
    isDarkMode ? 'bg-gray-900/95 border-gray-700/80 text-gray-100' : 'bg-white/95 border-purple-200/80 text-gray-700'
  );

  const menuItemBaseClasses = cn(
    'w-full text-left px-4 py-3 text-sm flex items-center space-x-2 transition-colors',
    isDarkMode ? 'hover:bg-gray-800/80 text-gray-100' : 'hover:bg-purple-50/90 text-gray-700'
  );

  const menuBorderColorClass = isDarkMode ? 'border-gray-800/70' : 'border-purple-100/80';
  const menuSeparatorClass = isDarkMode ? 'bg-gray-800/70' : 'bg-purple-100/80';
  const menuHeaderClasses = cn(
    'px-4 py-3 border-b',
    isDarkMode ? 'border-gray-800/70 bg-gray-900/70' : 'border-purple-100/80 bg-white/80'
  );
  const menuHeaderCaptionClasses = cn(
    'text-[10px] uppercase tracking-[0.18em] font-semibold',
    isDarkMode ? 'text-gray-400' : 'text-gray-500'
  );
  const menuHeaderNameClasses = cn('text-sm font-semibold truncate', isDarkMode ? 'text-gray-100' : 'text-gray-700');

  const logoutLabel = language === 'zh' ? '退出登录' : 'Log out';
  const signedInLabel = language === 'zh' ? '当前登录' : 'Signed in as';

  const handleMenuItemClick = (callback: () => void) => {
    setShowMenu(false);
    callback();
  };

  return (
    <>
      <Button
        ref={menuButtonRef}
        className="glass glass-hover"
        variant="ghost"
        size="icon"
        onClick={() => {
          if (!showMenu) {
            updateMenuPosition();
          }
          setShowMenu((previous) => !previous);
        }}
        title="Menu"
      >
        <Menu className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
      </Button>

      {showMenu &&
        createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setShowMenu(false)} />
            <div
              className={menuContainerClasses}
              style={{ zIndex: 9999, top: menuPosition.top, left: menuPosition.left }}
            >
              {user && (
                <div className={menuHeaderClasses}>
                  <span className={menuHeaderCaptionClasses}>{signedInLabel}</span>
                  <span className={menuHeaderNameClasses}>{user.username}</span>
                </div>
              )}

              <button
                className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                onClick={() => handleMenuItemClick(onCategoryClick)}
              >
                <FolderTree className="h-4 w-4" />
                <span>{translations.menuPromptCategories}</span>
              </button>

              <button
                className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                onClick={() => handleMenuItemClick(onTemplateClick)}
              >
                <FileText className="h-4 w-4" />
                <span>{translations.menuTemplateManagement}</span>
              </button>

              <a
                href="/tutorials/?utm_source=AI_POD_Lite"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                onClick={() => setShowMenu(false)}
              >
                <BookOpen className="h-4 w-4" />
                <span>{translations.menuTutorials}</span>
              </a>

              <a
                href="/community/?utm_source=AI_POD_Lite"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                onClick={() => setShowMenu(false)}
              >
                <Users className="h-4 w-4" />
                <span>{translations.menuCommunity}</span>
              </a>

              <a
                href="/assets/?utm_source=AI_POD_Lite"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                onClick={() => setShowMenu(false)}
              >
                <Package className="h-4 w-4" />
                <span>{translations.menuAssets}</span>
              </a>

              <a
                href="/wallet/?utm_source=AI_POD_Lite"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                onClick={() => setShowMenu(false)}
              >
                <Wallet className="h-4 w-4" />
                <span>{translations.menuWallet}</span>
              </a>

              <button
                className={cn(menuItemBaseClasses, 'border-b', menuBorderColorClass)}
                onClick={() => handleMenuItemClick(onSettingsClick)}
              >
                <Settings className="h-4 w-4" />
                <span>{translations.settings}</span>
              </button>

              <button className={menuItemBaseClasses} onClick={() => handleMenuItemClick(onInfoClick)}>
                <HelpCircle className="h-4 w-4" />
                <span>{translations.about}</span>
              </button>

              <Separator className={menuSeparatorClass} />

              <button
                className={cn(
                  menuItemBaseClasses,
                  'text-red-400 hover:text-red-300',
                  isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                )}
                onClick={() => handleMenuItemClick(onLogout)}
              >
                <LogOut className="h-4 w-4" />
                <span>{logoutLabel}</span>
              </button>
            </div>
          </>,
          document.body
        )}
    </>
  );
};
