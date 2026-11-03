import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, shadows } from '@/theme';

type Props = { size: number };

/** Ortak zemin: ince çizgili büyük daire + içinde dolu açık mavi daire */
function Backdrop({ size, children }: Props & { children: ReactNode }) {
  const inner = size * 0.62;
  return (
    <View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]} />
      <View
        style={[
          styles.innerCircle,
          { width: inner, height: inner, borderRadius: inner / 2, top: (size - inner) / 2, left: (size - inner) / 2 },
        ]}
      />
      {children}
    </View>
  );
}

function MiniTaskCard({
  size,
  checked,
  dot,
  lineRatio,
  style,
}: Props & { checked: boolean; dot?: boolean; lineRatio: number; style: ViewStyle }) {
  const h = size * 0.15;
  const box = h * 0.42;
  return (
    <View
      style={[
        styles.card,
        { height: h, borderRadius: size * 0.04, paddingHorizontal: h * 0.32, gap: h * 0.25 },
        style,
      ]}
    >
      <View
        style={[
          styles.check,
          { width: box, height: box, borderRadius: box / 2 },
          checked ? styles.checkOn : styles.checkOff,
        ]}
      >
        {checked ? <Feather name="check" size={box * 0.6} color={colors.white} /> : null}
      </View>
      <View style={[styles.line, { height: h * 0.14, flex: lineRatio }]} />
      <View style={{ flex: 1 - lineRatio }} />
      {dot ? <View style={[styles.dot, { width: h * 0.16, height: h * 0.16, borderRadius: h * 0.08 }]} /> : null}
    </View>
  );
}

/** 1. sayfa: görev kartları */
export function TasksIllustration({ size }: Props) {
  return (
    <Backdrop size={size}>
      <MiniTaskCard
        size={size}
        checked
        lineRatio={0.85}
        style={{ position: 'absolute', top: size * 0.24, left: size * 0.04, width: size * 0.74, transform: [{ rotate: '-3deg' }] }}
      />
      <MiniTaskCard
        size={size}
        checked
        lineRatio={0.7}
        style={{ position: 'absolute', top: size * 0.43, left: size * 0.2, width: size * 0.68 }}
      />
      <MiniTaskCard
        size={size}
        checked={false}
        dot
        lineRatio={0.6}
        style={{ position: 'absolute', top: size * 0.62, left: size * 0.06, width: size * 0.78, transform: [{ rotate: '2deg' }] }}
      />
    </Backdrop>
  );
}

/** 2. sayfa: hafta şeridi + zaman kartları */
export function CalendarIllustration({ size }: Props) {
  const day = size * 0.075;
  return (
    <Backdrop size={size}>
      <View
        style={[
          styles.card,
          styles.week,
          { top: size * 0.2, left: size * 0.08, width: size * 0.84, height: size * 0.18, borderRadius: size * 0.04, gap: size * 0.015 },
        ]}
      >
        {Array.from({ length: 7 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.day,
              { width: day, height: day * 1.5, borderRadius: day * 0.3 },
              i === 2 && styles.dayOn,
            ]}
          >
            <View style={[styles.dayDot, { backgroundColor: i === 2 ? colors.white : colors.primary }, i % 3 === 1 && styles.hidden]} />
          </View>
        ))}
      </View>
      <TimeCard size={size} top={0.45} color={colors.primary} lineColor="rgba(255,255,255,0.7)" />
      <TimeCard size={size} top={0.63} color={colors.accentLight} lineColor="#F5C9A0" />
    </Backdrop>
  );
}

function TimeCard({ size, top, color, lineColor }: Props & { top: number; color: string; lineColor: string }) {
  return (
    <View style={[styles.timeRow, { top: size * top, left: size * 0.08, width: size * 0.84, gap: size * 0.03 }]}>
      <View style={{ gap: size * 0.015, width: size * 0.12 }}>
        <View style={[styles.timeMark, { height: size * 0.025 }]} />
        <View style={[styles.timeMark, styles.timeMarkSoft, { height: size * 0.02, width: '70%' }]} />
      </View>
      <View
        style={[
          styles.timeCard,
          { backgroundColor: color, height: size * 0.14, borderRadius: size * 0.04, padding: size * 0.035, gap: size * 0.02 },
        ]}
      >
        <View style={[styles.lineBar, { backgroundColor: lineColor, height: size * 0.025, width: '75%' }]} />
        <View style={[styles.lineBar, { backgroundColor: lineColor, height: size * 0.02, width: '45%', opacity: 0.7 }]} />
      </View>
    </View>
  );
}

/** 3. sayfa: bar grafik + seri rozeti */
export function ProgressIllustration({ size }: Props) {
  const values = [0.45, 0.75, 0.35, 1, 0.6, 0.3];
  const chartH = size * 0.3;
  const badge = size * 0.16;
  return (
    <Backdrop size={size}>
      <View
        style={[
          styles.card,
          styles.chart,
          {
            top: size * 0.27,
            left: size * 0.1,
            width: size * 0.8,
            height: size * 0.46,
            borderRadius: size * 0.05,
            padding: size * 0.06,
            gap: size * 0.03,
          },
        ]}
      >
        {values.map((v, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { height: chartH * v, borderRadius: size * 0.02 },
              i === 3 && styles.barOn,
            ]}
          />
        ))}
      </View>
      <View
        style={[
          styles.badge,
          { width: badge, height: badge, borderRadius: badge * 0.3, top: size * 0.17, right: size * 0.1 },
        ]}
      >
        <Ionicons name="flame" size={badge * 0.5} color={colors.white} />
      </View>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', borderWidth: 1, borderColor: '#C9DDF5' },
  innerCircle: { position: 'absolute', backgroundColor: '#D9E9FB' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  check: { alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary },
  checkOff: { borderWidth: 2, borderColor: '#B7CFEA' },
  line: { borderRadius: 999, backgroundColor: colors.primaryLight },
  dot: { backgroundColor: colors.accent },
  week: { position: 'absolute', justifyContent: 'center' },
  day: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4, backgroundColor: colors.background },
  dayOn: { backgroundColor: colors.primary },
  dayDot: { width: 4, height: 4, borderRadius: 2 },
  hidden: { opacity: 0 },
  timeRow: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  timeMark: { borderRadius: 999, backgroundColor: colors.text, opacity: 0.75 },
  timeMarkSoft: { opacity: 0.25 },
  timeCard: { flex: 1, justifyContent: 'center', ...shadows.card },
  lineBar: { borderRadius: 999 },
  chart: { position: 'absolute', alignItems: 'flex-end' },
  bar: { flex: 1, backgroundColor: colors.primaryLight },
  barOn: { backgroundColor: colors.primary },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    ...shadows.raised,
  },
});
