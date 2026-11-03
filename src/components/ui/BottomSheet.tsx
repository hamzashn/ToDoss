import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useModalTransition } from '@/hooks/useModalTransition';
import { useResponsive } from '@/hooks/useResponsive';
import { CONTENT_MAX_WIDTH, colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Alttan kayarak açılan sayfa; zemin ayrı olarak kararır */
export function BottomSheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  const { gutter, height } = useResponsive();
  const { mounted, progress } = useModalTransition(visible, undefined, 260);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [height * 0.6, 0] });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <Animated.View style={[styles.overlay, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingHorizontal: gutter, paddingBottom: insets.bottom + spacing.xl, transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <AppText variant="h2" style={styles.title} numberOfLines={2}>
                {title}
              </AppText>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
                style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
              >
                <Feather name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : null}
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingTop: spacing.md,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  title: { flex: 1 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  closePressed: { backgroundColor: colors.track },
});
