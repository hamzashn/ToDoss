import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

import { AppText } from './ui/AppText';

type Props = {
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
  description?: string;
  descriptionColor?: string;
  onPress?: () => void;
  /** Sağ taraf: verilmezse onPress varken ok işareti */
  right?: ReactNode;
  destructive?: boolean;
};

export function SettingsRow({ icon, title, description, descriptionColor, onPress, right, destructive }: Props) {
  const tint = destructive ? colors.danger : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconBox, destructive && styles.iconBoxDanger]}>
        <Feather name={icon} size={18} color={tint} />
      </View>
      <View style={styles.text}>
        <AppText variant="title" color={destructive ? colors.danger : colors.text}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" color={descriptionColor ?? colors.textSecondary}>
            {description}
          </AppText>
        ) : null}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={20} color={colors.textMuted} /> : null)}
    </Pressable>
  );
}

/** Ayar satırlarını beyaz bir kartta gruplar */
export function SettingsGroup({ children }: { children: ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: { backgroundColor: colors.background },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  iconBoxDanger: { backgroundColor: '#FBE9E9' },
  text: { flex: 1, gap: 2 },
});
