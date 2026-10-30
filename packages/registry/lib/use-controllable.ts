import { useState } from 'react';

/** `value` wins when defined (null counts as a value); otherwise the component keeps its own state. */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void): [T, (next: T) => void] {
  const [own, setOwn] = useState(defaultValue);
  const current = value === undefined ? own : value;
  const set = (next: T) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  return [current, set];
}
