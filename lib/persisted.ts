/**
 * localStorage-backed value usable with useSyncExternalStore: the server (and hydration)
 * sees `fallback`, the client then re-renders with the stored value — no effects, no flash
 * of hydration errors.
 */
export function persisted<T>(key: string, fallback: T, codec: { parse: (raw: string) => T; stringify: (v: T) => string }) {
  const listeners = new Set<() => void>();
  let cache: { value: T } | null = null;

  const get = (): T => {
    if (cache) return cache.value;
    let value = fallback;
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) value = codec.parse(raw);
    } catch {}
    cache = { value };
    return value;
  };

  return {
    get,
    getServer: () => fallback,
    set(value: T) {
      cache = { value };
      try {
        localStorage.setItem(key, codec.stringify(value));
      } catch {}
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const boolCodec = { parse: (raw: string) => raw === "1", stringify: (v: boolean) => (v ? "1" : "0") };

export const listCodec = {
  parse: (raw: string) => {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  },
  stringify: (v: string[]) => JSON.stringify(v),
};
