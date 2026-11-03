import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

import { AppText } from './AppText';

type Props = { name: string; size?: number };

export function Avatar({ name, size = 44 }: Props) {
  const initial = name.trim().charAt(0).toLocaleUpperCase('tr-TR');

  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}>
      {initial ? (
        <AppText
          color={colors.primary}
          weight="bold"
          style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}
        >
          {initial}
        </AppText>
      ) : (
        <Feather name="user" size={size * 0.45} color={colors.primary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
});
