import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryError } from '@/db/categories';
import { useCategories } from '@/hooks/useCategories';
import { useOpenSession } from '@/hooks/useOpenSession';
import { categoryPalette, colors, spacing } from '@/theme';
import type { Category } from '@/types';

import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Verilirse düzenleme modunda açılır */
  category?: Category | null;
  onSaved?: (id: number) => void;
};

export function CategoryModal({ visible, onClose, category, onSaved }: Props) {
  // Kategori açılış anında sabitlenir: kapanırken başlık/form değişmez
  const { session, snapshot } = useOpenSession(visible, category ?? null);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={snapshot ? 'Kategoriyi düzenle' : 'Yeni kategori'}
    >
      {/* key: her açılışta form durumunu sıfırlar */}
      <CategoryForm key={session} category={snapshot} onClose={onClose} onSaved={onSaved} />
    </BottomSheet>
  );
}

function CategoryForm({ category, onClose, onSaved }: Omit<Props, 'visible'>) {
  const { create, update } = useCategories();
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState<string>(category?.color ?? categoryPalette[4]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      let id: number;
      if (category) {
        await update(category.id, { name, color, icon: category.icon });
        id = category.id;
      } else {
        id = await create({ name, color });
      }
      onSaved?.(id);
      onClose();
    } catch (e) {
      setError(e instanceof CategoryError ? e.message : 'Kategori kaydedilemedi, tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Kategori adı"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError(null);
        }}
        placeholder="Örn. Spor"
        maxLength={24}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={save}
        error={error}
      />
      <View style={styles.palette} accessibilityRole="radiogroup" accessibilityLabel="Renk">
        {categoryPalette.map((c) => {
          const selected = c === color;
          return (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityRole="radio"
              accessibilityLabel={`Renk ${c}`}
              accessibilityState={{ selected }}
              hitSlop={4}
              style={[styles.swatch, { backgroundColor: c }, selected && styles.swatchSelected]}
            >
              {selected ? <Feather name="check" size={18} color={colors.white} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Button title="Kaydet" onPress={save} loading={saving} disabled={!name.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderWidth: 3, borderColor: colors.primaryLight },
});
