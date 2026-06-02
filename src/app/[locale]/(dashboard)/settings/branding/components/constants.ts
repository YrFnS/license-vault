import { BrandingColors } from './types';

export const DEFAULT_COLORS: BrandingColors = {
  primary: '#10b981',
  secondary: '#14b8a6',
  accent: '#0d9488',
  darkPrimary: '#059669',
  darkSecondary: '#0f766e',
};

export const THEME_PRESETS: Record<string, BrandingColors> = {
  emerald: { primary: '#10b981', secondary: '#14b8a6', accent: '#0d9488', darkPrimary: '#059669', darkSecondary: '#0f766e' },
  teal: { primary: '#14b8a6', secondary: '#0d9488', accent: '#0f766e', darkPrimary: '#0d9488', darkSecondary: '#115e59' },
  rose: { primary: '#f43f5e', secondary: '#e11d48', accent: '#be123c', darkPrimary: '#e11d48', darkSecondary: '#9f1239' },
  amber: { primary: '#f59e0b', secondary: '#d97706', accent: '#b45309', darkPrimary: '#d97706', darkSecondary: '#92400e' },
  slate: { primary: '#64748b', secondary: '#475569', accent: '#334155', darkPrimary: '#475569', darkSecondary: '#1e293b' },
};

export const FONT_OPTIONS = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato', 'Nunito', 'Source Sans Pro'];

export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};
