import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [internalValue, setInternalValue] = useState<T>(value);
  const [debouncedValue, setDebouncedValue] = useState<T>(internalValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(internalValue);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [internalValue, delay]);

  return [debouncedValue, setInternalValue];
}
