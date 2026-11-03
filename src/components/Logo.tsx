import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './ui/AppText';

/** Mavi kare içinde ✓ + "ToDoss" */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="ToDoss">
      <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28 }]}>
        <Feather name="check" size={size * 0.6} color={colors.white} />
      </View>
      <AppText variant="title" weight="extrabold" style={{ fontSize: size * 0.56 }}>
        ToDoss
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.sm },
});
