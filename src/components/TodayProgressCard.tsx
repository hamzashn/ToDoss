import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, spacing } from '@/theme';
import { motivationMessage } from '@/utils/task';

import { AppText } from './ui/AppText';
import { ProgressRing } from './ui/ProgressRing';

type Props = { done: number; total: number };

export function TodayProgressCard({ done, total }: Props) {
  const { s } = useResponsive();
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`Bugünkü ilerleme: ${total} görevden ${done} tanesi tamamlandı`}
    >
      <View style={styles.decor} />
      <View style={styles.text}>
        <AppText variant="caption" weight="semibold" color="rgba(255,255,255,0.85)">
          Bugünkü ilerleme
        </AppText>
        <AppText variant="h1" color={colors.white} numberOfLines={1} adjustsFontSizeToFit>
          {done} / {total} görev
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.85)" numberOfLines={2}>
          {motivationMessage(done, total)}
        </AppText>
      </View>
      <ProgressRing percent={percent} size={s(68)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  decor: {
    position: 'absolute',
    right: -50,
    top: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  text: { flex: 1, gap: spacing.xs },
});
