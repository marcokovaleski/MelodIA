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
        setStored((prev) => (typeof value === 'function' ? value(prev) : value));
        window.localStorage.setItem(key, JSON.stringify(typeof value === 'function' ? value(stored) : value));
      } catch (e) {
        console.warn('useLocalStorage setItem error', e);
      }
    },
    [key, stored]
  );

  return [stored, setValue];
}

export default useLocalStorage;
