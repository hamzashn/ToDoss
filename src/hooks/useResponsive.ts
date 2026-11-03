import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { CONTENT_MAX_WIDTH, spacing } from '@/theme';
import { moderateScale, scale } from '@/utils/scale';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isSmall = width <= 360;
    const isTablet = width >= 768;
    const isShort = height < 700;
    const gutter = isSmall ? spacing.lg : spacing.xxl;
    const contentWidth = Math.min(width, CONTENT_MAX_WIDTH);

    return {
      width,
      height,
      isSmall,
      isTablet,
      isShort,
      gutter,
      contentWidth,
      s: (size: number) => scale(size, contentWidth),
      ms: (size: number, factor?: number) => moderateScale(size, contentWidth, factor),
    };
  }, [width, height]);
}
