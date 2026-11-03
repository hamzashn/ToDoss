import { StyleSheet, View } from 'react-native';

import type { CategoryProgressRow } from '@/db/stats';
import { colors, spacing } from '@/theme';

import { AppText } from './ui/AppText';
import { ProgressBar } from './ui/ProgressBar';

type Props = { rows: CategoryProgressRow[] };

export function CategoryProgress({ rows }: Props) {
  return (
    <View style={styles.wrap}>
      <AppText variant="title">Kategoriler</AppText>
      {rows.length === 0 ? (
        <AppText variant="caption" color={colors.textSecondary}>
          Bu dönemde görev yok
        </AppText>
      ) : (
        rows.map((r) => (
          <View
            key={r.id}
            style={styles.row}
            accessible
            accessibilityLabel={`${r.name}: ${r.total} görevden ${r.done} tanesi tamamlandı`}
          >
            <View style={styles.labels}>
              <AppText variant="label" numberOfLines={1} style={styles.name}>
                {r.name}
              </AppText>
              <AppText variant="label" color={colors.textSecondary}>
                {r.done}/{r.total}
              </AppText>
            </View>
            <ProgressBar value={r.done} total={r.total} color={r.color} />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  row: { gap: spacing.sm },
  labels: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { flex: 1 },
});
