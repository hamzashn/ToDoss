import { useSyncExternalStore } from 'react';

import { toISODate } from '@/utils/date';

// Takvimde seçili gün; sekme değişse de korunur ve FAB yeni görevi bu tarihle açar
let selected = toISODate(new Date());
const listeners = new Set<() => void>();

export function getSelectedDate(): string {
  return selected;
}

export function setSelectedDate(date: string): void {
  if (date === selected) return;
  selected = date;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSelectedDate(): [string, (date: string) => void] {
  const value = useSyncExternalStore(subscribe, getSelectedDate);
  return [value, setSelectedDate];
}
