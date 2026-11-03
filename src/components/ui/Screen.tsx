import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { useResponsive } from '@/hooks/useResponsive';
import { CONTENT_MAX_WIDTH, colors } from '@/theme';

type Props = {
  children: ReactNode;
  /** İçerik kaydırılabilir olsun mu (varsayılan: evet) */
  scroll?: boolean;
  /** Güvenli alan uygulanacak kenarlar. Sekme ekranlarında alt kenarı TabBar yönetir. */
  edges?: Edge[];
  /** Yatay kenar boşluğu uygulansın mı */
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Tüm ekranların ortak kabı: arka plan, güvenli alan, responsive kenar boşluğu
 * ve tablette içeriği CONTENT_MAX_WIDTH ile ortalama.
 */
export function Screen({ children, scroll = true, edges = ['top'], padded = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const { gutter } = useResponsive();

  const padding: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
  const inner: StyleProp<ViewStyle> = [
    styles.inner,
    padded && { paddingHorizontal: gutter },
    contentStyle,
  ];

  if (scroll) {
    return (
      <View style={[styles.root, padding]}>
        <ScrollView
          contentContainerStyle={inner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, padding]}>
      <View style={[inner, styles.fill]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  inner: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  fill: { flex: 1 },
});
