import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryModal } from '@/components/CategoryModal';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useDialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { CategoryError, type CategoryWithCount } from '@/db/categories';
import { useCategories } from '@/hooks/useCategories';
import { colors, radius, shadows, spacing } from '@/theme';

export default function CategoriesScreen() {
  const { categories, remove } = useCategories();
  // undefined: kapalı, null: yeni kategori, nesne: düzenleme
  const [editing, setEditing] = useState<CategoryWithCount | null | undefined>(undefined);

  const { show: showDialog, dialog } = useDialog();

  const confirmDelete = (c: CategoryWithCount) => {
    const fallback = categories.find((x) => x.slug === 'personal')?.name ?? 'Kişisel';
    showDialog({
      title: `"${c.name}" silinsin mi?`,
      message:
        c.taskCount > 0
          ? `Bu kategorideki ${c.taskCount} görev "${fallback}" kategorisine taşınacak.`
          : 'Bu kategoride görev yok.',
      icon: 'tag',
      actions: [
        { label: 'Vazgeç', style: 'cancel' },
        {
          label: 'Sil',
          style: 'destructive',
          onPress: () =>
            remove(c.id).catch((e) =>
              showDialog({
                title: 'Kategori silinemedi',
                message: e instanceof CategoryError ? e.message : 'Tekrar deneyin.',
                tone: 'warning',
              }),
            ),
        },
      ],
    });
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" accessibilityLabel="Geri" onPress={() => router.back()} />
        <AppText variant="h2">Kategoriler</AppText>
      </View>

      <View style={styles.list}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setEditing(c)}
            accessibilityRole="button"
            accessibilityLabel={`${c.name}, ${c.taskCount} görev`}
            accessibilityHint="Düzenlemek için dokun"
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={[styles.dot, { backgroundColor: c.color }]} />
            <View style={styles.text}>
              <AppText variant="title" numberOfLines={1}>
                {c.name}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {c.taskCount} görev
              </AppText>
            </View>
            {c.isDefault ? (
              <Badge label="Varsayılan" color={colors.textSecondary} background={colors.track} />
            ) : (
              <Pressable
                onPress={() => confirmDelete(c)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`${c.name} kategorisini sil`}
                style={styles.delete}
              >
                <Feather name="trash-2" size={18} color={colors.danger} />
              </Pressable>
            )}
          </Pressable>
        ))}
      </View>

      <Button title="Yeni kategori" icon="plus" onPress={() => setEditing(null)} />

      <AppText variant="caption" color={colors.textMuted} align="center">
        Varsayılan kategoriler yeniden adlandırılabilir ama silinemez.
      </AppText>

      <CategoryModal visible={editing !== undefined} category={editing} onClose={() => setEditing(undefined)} />
      {dialog}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  list: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.background },
  dot: { width: 14, height: 14, borderRadius: 7 },
  text: { flex: 1, gap: 2 },
  delete: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
