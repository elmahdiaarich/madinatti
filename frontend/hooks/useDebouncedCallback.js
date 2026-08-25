import { useEffect, useRef } from "react";

export function useDebouncedCallback(fn, delay = 400) {
  const fnRef = useRef(fn);
  const timeoutRef = useRef(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fnRef.current(...args);
    }, delay);
  };
}