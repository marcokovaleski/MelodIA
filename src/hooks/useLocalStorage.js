import { useState, useCallback } from 'react';

/**
 * Hook para persistir estado no localStorage.
 * @param {string} key
 * @param {*} initialValue
 * @returns {[*, function]}
 */
export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item != null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        setStored((prev) => {
          const nextValue = typeof value === 'function' ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(nextValue));
          return nextValue;
        });
      } catch (e) {
        console.warn('useLocalStorage setItem error', e);
      }
    },
    [key]
  );

  return [stored, setValue];
}

export default useLocalStorage;
