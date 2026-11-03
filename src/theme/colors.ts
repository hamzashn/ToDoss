export const colors = {
  primary: '#1F6FD1',
  primaryDark: '#1A5DB3',
  primaryLight: '#D6E8FB',
  primarySoft: '#EAF3FD',

  background: '#F3F7FD',
  surface: '#FFFFFF',

  text: '#0F2747',
  textSecondary: '#4A5A70',
  /** Beyaz ve ekran zemininde ≥4.5:1 (tasarımdaki #8A97AA AA'yı karşılamıyordu) */
  textMuted: '#647288',
  border: '#E3EAF3',
  /** Segment kontrolü ve ilerleme çubuğu izi */
  track: '#E8EEF6',

  accent: '#E07A1F',
  accentLight: '#FDEFE0',
  accentDark: '#7A3E0B',
  /** Açık zeminde turuncu metin (rozet, uyarı): AA kontrastlı ton */
  accentText: '#A4520C',

  success: '#2BA36B',
  successLight: '#E3F5EC',
  successDark: '#155C3B',
  successText: '#1D7A4F',
  danger: '#D64545',

  white: '#FFFFFF',
  chipDark: '#0F2747',
  overlay: 'rgba(15, 39, 71, 0.4)',
} as const;

export const priorityColors = {
  0: '#7DB3EE',
  1: '#1F6FD1',
  2: '#E07A1F',
} as const;

/** Kullanıcının yeni kategori oluştururken seçebileceği renkler */
export const categoryPalette = [
  '#1F6FD1',
  '#4C9BE8',
  '#E07A1F',
  '#2BA36B',
  '#8E5BD8',
  '#D64545',
  '#E0B21F',
  '#1FA7B5',
] as const;

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex(rgb: number[]): string {
  return `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Rengi beyaz üzerinde alpha opaklığıyla karıştırır (açık ton zeminler için opak eşdeğeri) */
export function tintOnWhite(hex: string, alpha: number): string {
  return toHex(parseHex(hex).map((v) => v * alpha + 255 * (1 - alpha)));
}

function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Metin rengini, zemin üzerinde WCAG AA (4.5:1) kontrastına ulaşana dek koyulaştırır.
 * Tonu korur; tasarım rengi zaten yeterliyse aynen döner.
 */
export function readableOn(fg: string, bg: string, target = 4.5): string {
  let rgb = parseHex(fg);
  for (let i = 0; i < 20 && contrastRatio(toHex(rgb), bg) < target; i++) {
    rgb = rgb.map((v) => v * 0.9) as [number, number, number];
  }
  return toHex(rgb);
}
