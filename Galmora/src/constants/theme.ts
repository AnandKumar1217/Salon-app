import { StatusBar as RNStatusBar, Platform } from 'react-native';

export const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 44;

/**
 * Glamora Design System & Theme
 * Warm, minimal, luxury salon aesthetic.
 */

export const colors = {
  // Brand Palette
  primary: '#4A1E36',       // Muted Plum (Signature)
  primaryLight: '#652D4C',  // Lighter plum for active states
  primaryDark: '#331224',   // Deep plum for pressed states
  primaryMuted: '#4A1E3615',// 8% plum tint for light badges

  // Accents
  rose: '#C88294',          // Subtle Rose
  roseLight: '#F3E5E8',     // Soft rose surface
  roseDark: '#A65D71',

  // Surfaces & Backgrounds
  background: '#FAF7F2',    // Warm Ivory
  surface: '#FFFFFF',       // Clean card surface
  surfaceWarm: '#F5EFEB',   // Soft beige surface
  surfaceMuted: '#EFE7DE',  // Muted beige for tags/dividers

  // Typography / Ink
  textPrimary: '#1F1E1E',   // Dark Charcoal
  textSecondary: '#615B57', // Warm Muted Gray
  textTertiary: '#9E9690',  // Subdued caption
  textInverse: '#FAF7F2',   // Light text for dark buttons

  // Borders & Dividers
  border: '#E8E0D5',        // Soft neutral border
  borderLight: '#F0EBE3',
  borderDark: '#D4C9BC',

  // Functional Status
  success: '#2E7D32',
  successLight: '#E8F5E9',
  warning: '#ED6C02',
  warningLight: '#FFF4E5',
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  info: '#0288D1',
  infoLight: '#E1F5FE',

  // WhatsApp Verified
  whatsapp: '#25D366',
  whatsappDark: '#128C7E',
  whatsappLight: '#E8F8F0',
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 28,
    display: 34,
  },
  lineHeight: {
    xs: 14,
    sm: 18,
    base: 22,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    display: 42,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  none: {},
  subtle: {
    shadowColor: '#1F1E1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#1F1E1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  floating: {
    shadowColor: '#1F1E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  modal: {
    shadowColor: '#1F1E1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
};
