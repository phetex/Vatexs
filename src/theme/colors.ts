export const lightColors = {
  primary: '#5B4EFF',
  primaryDark: '#4638E0',
  primaryLight: '#EDEBFF',
  accent: '#FF6B4A',
  background: '#FFFFFF',
  surface: '#F7F7FB',
  border: '#E6E6EE',
  text: '#14141F',
  textMuted: '#6B6B7B',
  textFaint: '#A0A0B0',
  success: '#1CB566',
  danger: '#E23D3D',
  white: '#FFFFFF',
  black: '#000000',
};

export const darkColors: ColorPalette = {
  primary: '#7B6FFF',
  primaryDark: '#5B4EFF',
  primaryLight: '#231F45',
  accent: '#FF8A6B',
  background: '#0E0E14',
  surface: '#1B1B26',
  border: '#2C2C3A',
  text: '#F2F2F7',
  textMuted: '#9C9CAD',
  textFaint: '#6E6E7F',
  success: '#2ED17F',
  danger: '#FF5C5C',
  white: '#FFFFFF',
  black: '#000000',
};

export type ColorPalette = typeof lightColors;

// Kept for any file that hasn't moved to useTheme() yet — always the light palette.
export const colors = lightColors;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
