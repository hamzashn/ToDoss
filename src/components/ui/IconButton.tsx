import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

type Props = {
  icon: ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
  accessibilityLabel: string;
  /** Sağ üstte turuncu bildirim noktası */
  badge?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon, onPress, accessibilityLabel, badge, size = 48, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Feather name={icon} size={20} color={colors.text} />
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.primarySoft },
  badge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
