/**
 * VIS Brand Color System - Tailwind CSS Extension
 * 
 * This file extends Tailwind CSS with the VIS brand colors.
 * Import this into your tailwind.config.js
 * 
 * Usage:
 * - bg-vis-teal-500
 * - text-vis-cyan-400
 * - border-vis-purple-600
 * - shadow-vis-glow-teal
 */

export const visColorExtension = {
  colors: {
    // VIS Teal Palette (Primary Brand)
    'vis-teal': {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
      DEFAULT: '#14b8a6',
    },
    
    // VIS Cyan Palette (Complementary)
    'vis-cyan': {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344',
      DEFAULT: '#06b6d4',
    },
    
    // VIS Purple Palette (Secondary Brand)
    'vis-purple': {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
      DEFAULT: '#a855f7',
    },
  },
  
  backgroundColor: {
    'vis-app': 'var(--vis-bg-app)',
    'vis-primary': 'var(--vis-bg-primary)',
    'vis-secondary': 'var(--vis-bg-secondary)',
    'vis-tertiary': 'var(--vis-bg-tertiary)',
    'vis-elevated': 'var(--vis-bg-elevated)',
    'vis-hover': 'var(--vis-bg-hover)',
    'vis-panel': 'var(--vis-panel-bg)',
    'vis-card': 'var(--vis-card-bg)',
  },
  
  borderColor: {
    'vis-default': 'var(--vis-border-default)',
    'vis-subtle': 'var(--vis-border-subtle)',
    'vis-strong': 'var(--vis-border-strong)',
    'vis-teal': 'var(--vis-border-teal)',
    'vis-teal-light': 'var(--vis-border-teal-light)',
    'vis-teal-strong': 'var(--vis-border-teal-strong)',
    'vis-purple': 'var(--vis-border-purple)',
    'vis-purple-light': 'var(--vis-border-purple-light)',
    'vis-purple-strong': 'var(--vis-border-purple-strong)',
  },
  
  textColor: {
    'vis-primary': 'var(--vis-text-primary)',
    'vis-secondary': 'var(--vis-text-secondary)',
    'vis-tertiary': 'var(--vis-text-tertiary)',
    'vis-muted': 'var(--vis-text-muted)',
    'vis-disabled': 'var(--vis-text-disabled)',
    'vis-teal': 'var(--vis-text-teal)',
    'vis-teal-bright': 'var(--vis-text-teal-bright)',
    'vis-cyan': 'var(--vis-text-cyan)',
    'vis-purple': 'var(--vis-text-purple)',
  },
  
  boxShadow: {
    'vis-sm': 'var(--vis-shadow-sm)',
    'vis-md': 'var(--vis-shadow-md)',
    'vis-lg': 'var(--vis-shadow-lg)',
    'vis-xl': 'var(--vis-shadow-xl)',
    'vis-glow-teal-sm': 'var(--vis-glow-teal-sm)',
    'vis-glow-teal-md': 'var(--vis-glow-teal-md)',
    'vis-glow-teal-lg': 'var(--vis-glow-teal-lg)',
    'vis-glow-purple-sm': 'var(--vis-glow-purple-sm)',
    'vis-glow-purple-md': 'var(--vis-glow-purple-md)',
    'vis-glow-purple-lg': 'var(--vis-glow-purple-lg)',
    'vis-glow-teal': 'var(--vis-shadow-glow-teal)',
    'vis-glow-purple': 'var(--vis-shadow-glow-purple)',
  },
  
  backgroundImage: {
    'vis-gradient-teal': 'var(--vis-gradient-teal-diagonal)',
    'vis-gradient-teal-h': 'var(--vis-gradient-teal-horizontal)',
    'vis-gradient-teal-v': 'var(--vis-gradient-teal-vertical)',
    'vis-gradient-purple': 'var(--vis-gradient-purple-horizontal)',
    'vis-gradient-purple-v': 'var(--vis-gradient-purple-vertical)',
    'vis-gradient-brand': 'var(--vis-gradient-brand)',
    'vis-gradient-brand-reverse': 'var(--vis-gradient-brand-reverse)',
    'vis-gradient-panel': 'var(--vis-gradient-bg-panel)',
    'vis-gradient-card': 'var(--vis-gradient-bg-card)',
    'vis-gradient-mesh': 'var(--vis-gradient-mesh)',
  },
  
  divideColor: {
    'vis-light': 'var(--vis-divider-light)',
    'vis-medium': 'var(--vis-divider-medium)',
    'vis-strong': 'var(--vis-divider-strong)',
  },
};

// Default export for easier importing
export default visColorExtension;
