import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBox}>
        <Feather name={icon} size={26} color={colors.primary} />
      </View>
      <AppText variant="title" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText variant="caption" color={colors.textSecondary} align="center">
          {description}
        </AppText>
      ) : null}
      {action ? <Button variant="link" title={action.label} icon="plus" onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.xs,
  },
});
