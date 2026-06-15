import { useEffect, useState } from "react";

function resolveInitialValue(initialValue) {
  return typeof initialValue === "function" ? initialValue() : initialValue;
}

function readSavedValue(key, initialValue, legacyKeys = []) {
  try {
    const keys = [key, ...legacyKeys];

    for (const storageKey of keys) {
      const savedValue = localStorage.getItem(storageKey);
      if (savedValue !== null) return JSON.parse(savedValue);
    }

    return resolveInitialValue(initialValue);
  } catch (error) {
    console.error(`Не удалось загрузить сохранение "${key}":`, error);
    return resolveInitialValue(initialValue);
  }
}

function usePersistentState(
  key,
  initialValue,
  { legacyKeys = [], migrate = null } = {},
) {
  const [value, setValue] = useState(() => {
    const loadedValue = readSavedValue(key, initialValue, legacyKeys);
    return typeof migrate === "function" ? migrate(loadedValue) : loadedValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Не удалось сохранить "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

export default usePersistentState;
