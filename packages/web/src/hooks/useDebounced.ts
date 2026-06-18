import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value`, updated at most every `delay` ms.
 * When `resetKey` changes (e.g. the active tool switches) the value syncs immediately,
 * so there is no stale-output flash on a context change — only typing is debounced.
 */
export function useDebounced<T>(value: T, delay = 120, resetKey?: unknown): T {
  const [debounced, setDebounced] = useState(value);

  // Immediate sync on context change.
  useEffect(() => {
    setDebounced(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Debounced sync while typing.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
