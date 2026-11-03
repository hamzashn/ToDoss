import { useEffect, useEffectEvent, useState } from 'react';
import { Animated, Easing } from 'react-native';

import { useReducedMotion } from './useReducedMotion';

/**
 * Modal açılış/kapanış animasyonu. `visible` false olduğunda modal hemen
 * kaldırılmaz; çıkış animasyonu bitince `mounted` false olur ve `onHidden` çağrılır.
 * `progress` 0 (kapalı) → 1 (açık) arasında native driver ile akar.
 */
export function useModalTransition(visible: boolean, onHidden?: () => void, duration = 220) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));

  // Açılırken modal hemen bağlanır (render sırasında türetilmiş durum)
  if (visible && !mounted) setMounted(true);

  const handleHidden = useEffectEvent(() => onHidden?.());

  useEffect(() => {
    if (!mounted) return;
    const anim = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : visible ? duration : duration * 0.8,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      // Animasyon yarıda kesildiyse (ör. kapanırken yeniden açıldı) kaldırma
      if (finished && !visible) {
        setMounted(false);
        handleHidden();
      }
    });
    return () => anim.stop();
  }, [visible, mounted, duration, reduceMotion, progress]);

  return { mounted, progress };
}
