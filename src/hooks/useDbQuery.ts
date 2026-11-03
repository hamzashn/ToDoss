import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { events, type DataChannel } from '@/utils/events';

type State<T> = { data: T | undefined; loading: boolean; error: Error | null };

/**
 * Bir DB sorgusunu çalıştırır ve verilen kanallarda değişiklik olduğunda yeniler.
 * `query` useCallback ile sabitlenmeli; bağımlılıkları değişince sorgu yeniden çalışır.
 */
export function useDbQuery<T>(channels: DataChannel[], query: (db: SQLiteDatabase) => Promise<T>) {
  const db = useSQLiteContext();
  const [state, setState] = useState<State<T>>({ data: undefined, loading: true, error: null });
  // Yarış durumunda yalnızca en son isteğin sonucu yazılır
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await query(db);
      if (id === requestId.current) setState({ data, loading: false, error: null });
    } catch (e) {
      console.error(e);
      if (id === requestId.current) {
        setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e : new Error(String(e)) }));
      }
    }
  }, [db, query]);

  const channelKey = channels.join(',');

  useEffect(() => {
    refresh();
    const unsubscribers = (channelKey.split(',') as DataChannel[]).map((c) => events.on(c, refresh));
    return () => unsubscribers.forEach((off) => off());
  }, [refresh, channelKey]);

  return { ...state, refresh };
}
