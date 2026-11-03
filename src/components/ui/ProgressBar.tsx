import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors, radius } from '@/theme';

type Props = { value: number; total: number; color?: string };

export function ProgressBar({ value, total, color = colors.primary }: Props) {
  const reduceMotion = useReducedMotion();
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(ratio);
      return;
    }
    Animated.timing(progress, { toValue: ratio, duration: 600, useNativeDriver: false }).start();
  }, [ratio, reduceMotion, progress]);

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
