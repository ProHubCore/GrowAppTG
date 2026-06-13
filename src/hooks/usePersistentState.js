import { useEffect, useState } from "react";

function readSavedValue(key, initialValue) {
  try {
    const savedValue = localStorage.getItem(key);

    if (savedValue === null) {
      return typeof initialValue === "function"
        ? initialValue()
        : initialValue;
    }

    return JSON.parse(savedValue);
  } catch (error) {
    console.error(`Не удалось загрузить сохранение "${key}":`, error);

    return typeof initialValue === "function"
      ? initialValue()
      : initialValue;
  }
}

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() =>
    readSavedValue(key, initialValue)
  );

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