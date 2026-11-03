import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toISODate } from '@/utils/date';

/**
 * Bugünün 'YYYY-MM-DD' değeri. Gece yarısı geçtiğinde ve uygulama
 * arka plandan döndüğünde güncellenir.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => toISODate(new Date()));

  useEffect(() => {
    const sync = () => setToday(toISODate(new Date()));

    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(sync, nextMidnight.getTime() - now.getTime() + 1000);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [today]);

  return today;
}
