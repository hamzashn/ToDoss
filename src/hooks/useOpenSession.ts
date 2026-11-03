import { useState } from 'react';

/**
 * Animasyonlu modallar için: her açılışta `session` artar (form durumunu sıfırlamak için
 * `key` olarak kullanılır) ve `snapshot` açılış anındaki değeri tutar. Böylece kapanış
 * animasyonu boyunca içerik boşalmaz.
 */
export function useOpenSession<T>(visible: boolean, value: T): { session: number; snapshot: T } {
  const [state, setState] = useState({ wasVisible: visible, session: visible ? 1 : 0, snapshot: value });

  // Görünürlük değiştiğinde render sırasında türetilmiş durum güncellenir
  if (visible !== state.wasVisible) {
    setState({
      wasVisible: visible,
      session: visible ? state.session + 1 : state.session,
      snapshot: visible ? value : state.snapshot,
    });
  }

  return { session: state.session, snapshot: state.snapshot };
}
