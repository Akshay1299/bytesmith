import { useEffect, useState } from 'react';

/** Returns a debounced copy of `value`, updated at most every `delay` ms. */
export function useDebounced<T>(value: T, delay = 120): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
