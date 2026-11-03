import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

import { AppText } from './ui/AppText';

type Props = {
  label: string;
  value: string;
  /** Alt metin; tone rengini belirler */
  note?: string | null;
  tone?: 'positive' | 'negative' | 'neutral';
};

const TONE_COLORS = {
  positive: colors.primary,
  negative: colors.danger,
  neutral: colors.textMuted,
};

export function StatCard({ label, value, note, tone = 'neutral' }: Props) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}${note ? `, ${note}` : ''}`}>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="stat" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="caption" weight="semibold" color={TONE_COLORS[tone]} numberOfLines={2}>
        {note ?? ' '}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
});
