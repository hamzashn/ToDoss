import Feather from '@expo/vector-icons/Feather';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { colors } from '@/theme';

type Props = {
  checked: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
};

export function Checkbox({ checked, onPress, accessibilityLabel, size = 28 }: Props) {
  const reduceMotion = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const wasChecked = useRef(checked);

  // Yalnızca işaretsiz → işaretli geçişinde küçük bir "pop" (ilk yüklemede oynatılmaz)
  useEffect(() => {
    const was = wasChecked.current;
    wasChecked.current = checked;
    if (was || !checked || reduceMotion) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
  }, [checked, reduceMotion, scale]);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {checked ? (
        <Animated.View
          style={[styles.fill, { borderRadius: size / 2, transform: [{ scale }] }]}
        >
          <Feather name="check" size={size * 0.55} color={colors.white} />
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: '#C9D5E4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  // Dolgu kenarlığın üstünü de kaplar
  fill: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
