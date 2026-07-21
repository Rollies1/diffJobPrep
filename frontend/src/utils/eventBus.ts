type Listener = (data?: any) => void;

const listeners: Map<string, Listener[]> = new Map();

export const eventBus = {
  on(event: string, cb: Listener) {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event)!.push(cb);
    return () => this.off(event, cb);
  },

  off(event: string, cb: Listener) {
    const cbs = listeners.get(event);
    if (cbs) {
      listeners.set(event, cbs.filter((fn) => fn !== cb));
      if (listeners.get(event)?.length === 0) {
        listeners.delete(event); // Optimization: Clean up empty event arrays
      }
    }
  },

  emit(event: string, data?: any) {
    listeners.get(event)?.forEach((cb) => cb(data));
  },
};
