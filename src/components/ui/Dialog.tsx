import Feather from '@expo/vector-icons/Feather';
import { useCallback, useState, type ComponentProps, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';

import { useModalTransition } from '@/hooks/useModalTransition';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, shadows, spacing } from '@/theme';

import { AppText } from './AppText';

type IconName = ComponentProps<typeof Feather>['name'];

export type DialogAction = {
  label: string;
  /** cancel: ikincil buton; destructive: kırmızı ana buton; default: mavi ana buton */
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type DialogTone = 'danger' | 'warning' | 'info' | 'success';

export type DialogOptions = {
  title: string;
  message?: string;
  /** Verilmezse eylemlerden türetilir: yıkıcı eylem varsa danger, yoksa info */
  tone?: DialogTone;
  icon?: IconName;
  /** Verilmezse tek "Tamam" butonu */
  actions?: DialogAction[];
};

const TONES: Record<DialogTone, { icon: IconName; color: string; background: string }> = {
  danger: { icon: 'trash-2', color: colors.danger, background: '#FBE9E9' },
  warning: { icon: 'alert-triangle', color: colors.accentText, background: colors.accentLight },
  info: { icon: 'info', color: colors.primary, background: colors.primarySoft },
  success: { icon: 'check-circle', color: colors.successText, background: colors.successLight },
};

/**
 * Uygulamanın görsel diline uygun onay/uyarı penceresi (Alert.alert yerine).
 * Ekran başına kullanılır: iOS'ta modal ekranların üstünde de doğru açılır.
 *
 * const { show, dialog } = useDialog();
 * show({ title: 'Silinsin mi?', actions: [{ label: 'Vazgeç', style: 'cancel' }, { label: 'Sil', style: 'destructive', onPress }] });
 * return <>...{dialog}</>;
 */
export function useDialog() {
  const [state, setState] = useState<{
    options: DialogOptions;
    visible: boolean;
    /** Kapanış animasyonu bitince çalışacak eylem */
    pending?: () => void;
  } | null>(null);

  const show = useCallback((options: DialogOptions) => setState({ options, visible: true }), []);

  const dialog: ReactNode = state ? (
    <DialogView
      {...state.options}
      visible={state.visible}
      onAction={(action) => setState({ ...state, visible: false, pending: action?.onPress })}
      onHidden={() => {
        const pending = state.pending;
        setState(null);
        // Eylem başka bir diyalog açabilir (ör. ikinci onay); önceki tamamen kapandıktan sonra
        pending?.();
      }}
    />
  ) : null;

  return { show, dialog };
}

type ViewProps = DialogOptions & {
  visible: boolean;
  onAction: (action: DialogAction | undefined) => void;
  onHidden: () => void;
};

function DialogView({ title, message, tone, icon, actions, visible, onAction, onHidden }: ViewProps) {
  const { gutter } = useResponsive();
  const { mounted, progress } = useModalTransition(visible, onHidden);

  const list = actions?.length ? actions : [{ label: 'Tamam' }];
  const resolvedTone = tone ?? (list.some((a) => a.style === 'destructive') ? 'danger' : 'info');
  const t = TONES[resolvedTone];
  const cancel = list.find((a) => a.style === 'cancel');
  // Geri tuşu / zemine dokunma: vazgeç eylemi; tek eylemli bilgilendirmede o eylem
  const dismiss = cancel ?? (list.length === 1 ? list[0] : undefined);
  // İki eylemde yan yana (ikincil solda), fazlasında alt alta
  const horizontal = list.length === 2;
  const ordered = horizontal
    ? [...list.filter((a) => a.style === 'cancel'), ...list.filter((a) => a.style !== 'cancel')]
    : list;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => dismiss && onAction(dismiss)}
    >
      <View style={[styles.root, { paddingHorizontal: gutter }]}>
        <Animated.View style={[styles.overlay, { opacity: progress }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismiss ? () => onAction(dismiss) : undefined}
            accessibilityLabel="Kapat"
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            styles.card,
            {
              opacity: progress,
              transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            },
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: t.background }]}>
            <Feather name={icon ?? t.icon} size={24} color={t.color} />
          </View>
          <AppText variant="h2" align="center">
            {title}
          </AppText>
          {message ? (
            <AppText variant="body" color={colors.textSecondary} align="center">
              {message}
            </AppText>
          ) : null}
          <View style={[styles.actions, horizontal && styles.actionsRow]}>
            {ordered.map((a) => (
              <DialogButton key={a.label} action={a} grow={horizontal} onPress={() => onAction(a)} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DialogButton({ action, grow, onPress }: { action: DialogAction; grow: boolean; onPress: () => void }) {
  const secondary = action.style === 'cancel';
  const bg = secondary ? colors.track : action.style === 'destructive' ? colors.danger : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        grow && styles.buttonGrow,
        { backgroundColor: bg },
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="title" color={secondary ? colors.text : colors.white} numberOfLines={2} align="center">
        {action.label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    ...shadows.raised,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
  actionsRow: { flexDirection: 'row' },
  button: {
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGrow: { flex: 1 },
  pressed: { opacity: 0.85 },
});
