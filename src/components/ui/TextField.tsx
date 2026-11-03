import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

import { AppText } from './AppText';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
};

export function TextField({ label, error, multiline, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="label" color={colors.textSecondary}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        maxFontSizeMultiplier={1.3}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={label}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          webNoOutline,
          multiline && styles.multiline,
          focused && styles.focused,
          !!error && styles.errored,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

// Web: tarayıcının odak çizgisi yerine mavi kenarlık görünsün ('none' RN tiplerinde yok)
const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  input: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  multiline: { minHeight: 96, fontFamily: fonts.medium, fontSize: 15 },
  focused: { borderColor: colors.primary, borderWidth: 1.5 },
  errored: { borderColor: colors.danger },
});
