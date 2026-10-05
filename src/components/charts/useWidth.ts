"use client";

import { useEffect, useRef, useState } from "react";

// Tracks an element's rendered width so SVG charts can lay out in real pixels.
// Width is null until measured, so nothing is laid out at a guessed size.
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
