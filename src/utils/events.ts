export type DataChannel = 'tasks' | 'categories' | 'settings';

type Listener = () => void;

const listeners = new Map<DataChannel, Set<Listener>>();

/**
 * Veri değişikliği yayını. Repository yazmalarından sonra ilgili kanal
 * tetiklenir; hook'lar abone olup yeniden sorgular.
 */
export const events = {
  on(channel: DataChannel, listener: Listener): () => void {
    let set = listeners.get(channel);
    if (!set) {
      set = new Set();
      listeners.set(channel, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  },

  emit(...channels: DataChannel[]): void {
    for (const channel of channels) {
      listeners.get(channel)?.forEach((listener) => listener());
    }
  },
};
