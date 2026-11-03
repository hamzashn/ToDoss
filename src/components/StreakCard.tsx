import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './ui/AppText';

type Props = { streak: number; completedToday: boolean };

function streakCopy(streak: number, completedToday: boolean) {
  if (streak === 0) {
    return { title: 'Seri başlat', subtitle: 'Bugün bir görev tamamla, serin başlasın' };
  }
  return {
    title: `${streak} gün seri`,
    subtitle: completedToday
      ? 'Her gün en az bir görev tamamladın'
      : 'Bugün bir görev tamamla, serini koru',
  };
}

export function StreakCard({ streak, completedToday }: Props) {
  const { s } = useResponsive();
  const { title, subtitle } = streakCopy(streak, completedToday);

  return (
    <View style={styles.card} accessible accessibilityLabel={`${title}. ${subtitle}`}>
      <View style={styles.decor} />
      <View style={[styles.iconBox, { width: s(52), height: s(52) }]}>
        <Ionicons name="flame-outline" size={s(24)} color={colors.white} />
      </View>
      <View style={styles.text}>
        <AppText variant="h1" color={colors.white} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.9)" numberOfLines={2}>
          {subtitle}
        </AppText>
      </View>
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
    right: -40,
    bottom: -80,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBox: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  text: { flex: 1, gap: 2 },
});
