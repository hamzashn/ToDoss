import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { getSelectedDate } from '@/hooks/useSelectedDate';
import { CONTENT_MAX_WIDTH, colors, radius, shadows, spacing } from '@/theme';

type IconName = ComponentProps<typeof Feather>['name'];

const TAB_ICONS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Ana sayfa' },
  calendar: { icon: 'calendar', label: 'Takvim' },
  stats: { icon: 'bar-chart-2', label: 'İlerleme' },
  profile: { icon: 'user', label: 'Profil' },
};

/** FAB'ın çubuğun üstüne taşma miktarı */
const FAB_OVERFLOW = 18;

export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { s } = useResponsive();
  const barHeight = s(68);
  const fabSize = s(60);

  const onFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Takvimdeyken yeni görev seçili günle açılır
    if (state.routes[state.index]?.name === 'calendar') {
      router.push({ pathname: '/task/new', params: { date: getSelectedDate() } });
    } else {
      router.push('/task/new');
    }
  };

  const items = state.routes.map((route, index) => {
    const config = TAB_ICONS[route.name];
    if (!config) return null;
    const focused = index === state.index;

    const onPress = () => {
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        Haptics.selectionAsync();
        navigateToTab(route.key);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityLabel={config.label}
        accessibilityState={{ selected: focused }}
        style={styles.item}
      >
        <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
          <Feather
            name={config.icon}
            size={22}
            color={focused ? colors.primary : colors.textSecondary}
          />
        </View>
      </Pressable>
    );
  });

  // FAB, ilk iki sekmenin ardından ortaya yerleşir
  const middle = Math.ceil(items.length / 2);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: FAB_OVERFLOW, paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.sm },
      ]}
    >
      <View style={[styles.bar, { height: barHeight }]}>
        {items.slice(0, middle)}
        <View style={styles.item} />
        {items.slice(middle)}
      </View>

      {/* FAB kabın içinde mutlak konumlu: Android'de ebeveyn dışına taşan öğeler dokunma almaz */}
      <View style={styles.fabWrap} pointerEvents="box-none">
        <Pressable
          onPress={onFabPress}
          accessibilityRole="button"
          accessibilityLabel="Yeni görev ekle"
          style={({ pressed }) => [
            styles.fab,
            { width: fabSize, height: fabSize },
            pressed && styles.fabPressed,
          ]}
        >
          <Feather name="plus" size={28} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  bar: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: colors.primarySoft },
  fabWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  fab: {
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raised,
  },
  fabPressed: { backgroundColor: colors.primaryDark },
});
