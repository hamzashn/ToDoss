/** Tasarımların çizildiği referans genişlik (dp) */
export const BASE_WIDTH = 390;

/** Genişliğe göre ölçek; tabletlerde aşırı büyümeyi önlemek için 1.25 ile sınırlanır */
export function scale(size: number, width: number): number {
  return size * Math.min(width / BASE_WIDTH, 1.25);
}

/** Font ve boşluklar için yumuşatılmış ölçek */
export function moderateScale(size: number, width: number, factor = 0.5): number {
  return size + (scale(size, width) - size) * factor;
}
