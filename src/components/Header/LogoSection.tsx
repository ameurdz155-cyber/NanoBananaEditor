import React from 'react';
import logoHeader from '../../assets/AI-POD-lite-logo.png';
import logoHeaderLight from '../../assets/AI-POD-lite-logo-light.png';

interface LogoSectionProps {
  isDarkMode: boolean;
  appName: string;
  versionBadge: string;
}

export const LogoSection: React.FC<LogoSectionProps> = ({ isDarkMode, appName, versionBadge }) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-3">
        <img
          src={isDarkMode ? logoHeader : logoHeaderLight}
          alt={appName}
          className="h-10 object-contain transition-opacity duration-300"
        />
      </div>
      <div
        className="px-3 py-1 text-xs font-semibold"
        style={{ color: 'var(--accent-cyan)', border: 'none', background: 'transparent' }}
      >
        {versionBadge}
      </div>
    </div>
  );
};
