import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

import { AppText } from './AppText';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'link';
  /** Metnin sağındaki ikon ("Başlayalım →") */
  icon?: ComponentProps<typeof Feather>['name'];
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  color,
  style,
}: Props) {
  const isPrimary = variant === 'primary';
  const textColor = color ?? (isPrimary ? colors.white : colors.primary);
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        isPrimary ? styles.primary : styles.link,
        isPrimary && pressed && styles.primaryPressed,
        !isPrimary && pressed && styles.linkPressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          <AppText variant="title" color={textColor}>
            {title}
          </AppText>
          {icon ? <Feather name={icon} size={18} color={textColor} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    ...shadows.raised,
  },
  primaryPressed: { backgroundColor: colors.primaryDark },
  link: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  linkPressed: { opacity: 0.6 },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
