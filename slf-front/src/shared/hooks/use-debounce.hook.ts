import { useState, useEffect } from 'react';

// Delays updating a value until the user stops typing.
// Used in search bars to avoid sending an API request on every keystroke.
//
// Example:
//   const debouncedSearchText = useDebounce(searchText, 400);
//   → debouncedSearchText only updates 400ms after the user stops typing
export function useDebounce<ValueType>(
  currentValue: ValueType,
  delayInMilliseconds: number,
): ValueType {
  const [debouncedValue, setDebouncedValue] = useState<ValueType>(currentValue);

  useEffect(() => {
    // Wait for the delay to pass before updating the debounced value
    const waitTimer = setTimeout(() => {
      setDebouncedValue(currentValue);
    }, delayInMilliseconds);

    // If the value changes before the timer fires, reset the timer
    return () => clearTimeout(waitTimer);
  }, [currentValue, delayInMilliseconds]);

  return debouncedValue;
}
