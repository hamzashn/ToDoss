import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';

export type ActionSheetItem = {
  label: string;
  icon: ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  destructive?: boolean;
  /** Seçili seçeneği işaretler (ör. hatırlatma süresi) */
  selected?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionSheetItem[];
};

/** Android Alert en fazla 3 buton gösterdiği için çok seçenekli menülerde kullanılır */
export function ActionSheet({ visible, onClose, title, items }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.list}>
        {items.map((item) => {
          const color = item.destructive ? colors.danger : colors.text;
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                onClose();
                // iOS, kapanmakta olan bir Modal'ın üstüne Alert/Modal açamaz
                setTimeout(item.onPress, Platform.OS === 'ios' ? 350 : 0);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: !!item.selected }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={[styles.iconBox, item.destructive && styles.iconBoxDanger]}>
                <Feather name={item.icon} size={18} color={item.destructive ? colors.danger : colors.primary} />
              </View>
              <AppText variant="title" color={color} style={styles.label}>
                {item.label}
              </AppText>
              {item.selected ? <Feather name="check" size={20} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.background },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  iconBoxDanger: { backgroundColor: '#FBE9E9' },
  label: { flex: 1 },
});
