import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors } from '@/theme';
import { formatPercent } from '@/utils/date';

import { AppText } from './AppText';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0–100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
};

export function ProgressRing({
  percent,
  size = 64,
  strokeWidth = 6,
  color = colors.white,
  trackColor = 'rgba(255, 255, 255, 0.25)',
}: Props) {
  const reduceMotion = useReducedMotion();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const [progress] = useState(() => new Animated.Value(0));

  // Yay önceki değerden yenisine akar
  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(clamped);
      return;
    }
    Animated.timing(progress, { toValue: clamped, duration: 600, useNativeDriver: false }).start();
  }, [clamped, reduceMotion, progress]);

  const dashOffset = progress.interpolate({ inputRange: [0, 100], outputRange: [circumference, 0] });
  const arc = {
    cx: size / 2,
    cy: size / 2,
    r,
    stroke: color,
    strokeWidth,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeDasharray: `${circumference} ${circumference}`,
  };

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Yüzde ${Math.round(clamped)}`}
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {Platform.OS === 'web' ? (
          // Web'de Animated, SVG elemanına geçersiz DOM özelliği (collapsable) geçiriyor
          <Circle
            {...arc}
            strokeDashoffset={circumference * (1 - clamped / 100)}
          />
        ) : (
          <AnimatedCircle {...arc} strokeDashoffset={dashOffset} />
        )}
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <AppText variant="label" weight="extrabold" color={color}>
            {formatPercent(clamped)}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Dolu yay saat 12 yönünden başlasın
  svg: { transform: [{ rotate: '-90deg' }] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
