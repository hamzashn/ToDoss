import { Platform, type ViewStyle } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const shadows = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1F3A5F',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    default: { elevation: 2 },
  }),
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1F6FD1',
      shadowOpacity: 0.35,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
    },
    default: { elevation: 8 },
  }),
};

/** Tablet ve geniş ekranlarda içeriğin ortalanacağı azami genişlik */
export const CONTENT_MAX_WIDTH = 560;
