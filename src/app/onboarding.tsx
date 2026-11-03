import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import {
  Animated,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type ListViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/Logo';
import {
  CalendarIllustration,
  ProgressIllustration,
  TasksIllustration,
} from '@/components/onboarding/Illustrations';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useResponsive } from '@/hooks/useResponsive';
import { useSettings } from '@/hooks/useSettings';
import { CONTENT_MAX_WIDTH, colors, radius, spacing } from '@/theme';

type Slide = {
  key: string;
  title: string;
  description: string;
  Illustration: ComponentType<{ size: number }>;
};

const SLIDES: Slide[] = [
  {
    key: 'plan',
    title: 'Gününü planla,\naklını hafiflet.',
    description: 'Görevlerini tek yerde topla, önceliklendir ve her tamamladığında ilerlemeni gör.',
    Illustration: TasksIllustration,
  },
  {
    key: 'calendar',
    title: 'Takvimle zamanı\nyönet.',
    description:
      'Görevlerine tarih ve saat ver, haftanı tek bakışta gör, hatırlatıcıyla hiçbir şeyi kaçırma.',
    Illustration: CalendarIllustration,
  },
  {
    key: 'progress',
    title: 'İlerlemeni\ntakip et.',
    description: 'Serini koru, tamamlama oranını gör ve her gün biraz daha iyiye git.',
    Illustration: ProgressIllustration,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width, height, gutter, isShort } = useResponsive();
  const { set } = useSettings();

  const listRef = useRef<FlatList<Slide>>(null);
  const [scrollX] = useState(() => new Animated.Value(0));
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<'slides' | 'name'>('slides');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  // Üst panel ve illüstrasyon boyutları ekran oranına göre
  const panelHeight = height * (isShort ? 0.45 : 0.55);
  const illustrationSize = Math.min(width - gutter * 2, panelHeight - insets.top - 100, 420);

  // Android geri tuşu: ad adımından sayfalara döner
  useEffect(() => {
    if (step !== 'name') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep('slides');
      return true;
    });
    return () => sub.remove();
  }, [step]);

  // FlatList bu callback'in değişmemesini ister
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }, []);

  // Göstergeler metinle aynı hizada, panelin hemen altında
  const textLeft = (width - Math.min(width, CONTENT_MAX_WIDTH)) / 2 + gutter;

  const finish = async (userName?: string) => {
    setSaving(true);
    try {
      if (userName != null) await set('userName', userName.trim().slice(0, 30));
      await set('onboardingDone', true);
      router.replace('/(tabs)');
    } catch {
      setSaving(false);
    }
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      setStep('name');
    }
  };

  const panelStyle = [
    styles.panel,
    { height: panelHeight, paddingTop: insets.top + spacing.lg, paddingHorizontal: gutter },
  ];

  if (step === 'name') {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Panel esnek: klavye açılınca küçülür, form her zaman görünür kalır */}
        <View
          style={[
            styles.panel,
            styles.namePanel,
            { maxHeight: panelHeight, paddingTop: insets.top + spacing.lg, paddingHorizontal: gutter },
          ]}
        >
          <View style={styles.logoRow}>
            <Logo />
          </View>
          <View style={styles.center}>
            <Avatar name={name} size={Math.min(illustrationSize * 0.45, 140)} />
          </View>
        </View>
        <View style={[styles.nameForm, { paddingHorizontal: gutter, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.text}>
            <AppText variant="display">Sana nasıl{'\n'}hitap edelim?</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              Adını yalnızca uygulama içinde seni selamlamak için kullanırız.
            </AppText>
          </View>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder="Adın"
            accessibilityLabel="Adın"
            maxLength={30}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => finish(name)}
          />
          <View style={styles.actions}>
            <Button title="Devam et" icon="arrow-right" onPress={() => finish(name)} loading={saving} />
            <Button variant="link" title="Şimdilik atla" onPress={() => finish()} disabled={saving} />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <View style={panelStyle}>
              <View style={styles.logoRow}>
                <Logo />
              </View>
              <View style={styles.center}>
                <item.Illustration size={illustrationSize} />
              </View>
            </View>
            <View style={[styles.text, styles.slideText, { paddingHorizontal: gutter }]}>
              <AppText variant="display">{item.title}</AppText>
              <AppText variant="body" color={colors.textSecondary}>
                {item.description}
              </AppText>
            </View>
          </View>
        )}
      />

      <View style={[styles.dots, { top: panelHeight + spacing.xl, left: textLeft }]} pointerEvents="none">
        <Dots count={SLIDES.length} scrollX={scrollX} width={width} />
      </View>

      <View style={[styles.footer, { paddingHorizontal: gutter, paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.actions}>
          <Button title={index === 0 ? 'Başlayalım' : 'Devam et'} icon="arrow-right" onPress={next} />
          <Button variant="link" title="Zaten hesabım var" onPress={() => finish()} disabled={saving} />
        </View>
      </View>
    </View>
  );
}

/** Aktif sayfa uzun çizgi; kaydırmayla akıcı geçiş */
function Dots({ count, scrollX, width }: { count: number; scrollX: Animated.Value; width: number }) {
  return (
    <View style={styles.dotRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => {
        const range = [(i - 1) * width, i * width, (i + 1) * width];
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: scrollX.interpolate({ inputRange: range, outputRange: [6, 24, 6], extrapolate: 'clamp' }),
                backgroundColor: scrollX.interpolate({
                  inputRange: range,
                  outputRange: [colors.primaryLight, colors.primary, colors.primaryLight],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  panel: {
    backgroundColor: colors.primarySoft,
    borderBottomLeftRadius: radius.xl * 1.6,
    borderBottomRightRadius: radius.xl * 1.6,
  },
  logoRow: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { gap: spacing.md, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  // Üstte sayfa göstergesine yer bırakır
  slideText: { paddingTop: spacing.xl * 2 + 6 + spacing.sm },
  footer: { gap: spacing.xl, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  namePanel: { flex: 1, minHeight: 0, overflow: 'hidden' },
  nameForm: {
    gap: spacing.xl,
    paddingTop: spacing.xxl,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  actions: { gap: spacing.xs },
  dots: { position: 'absolute' },
  dotRow: { flexDirection: 'row', gap: spacing.xs + 2 },
  dot: { height: 6, borderRadius: 3 },
});
