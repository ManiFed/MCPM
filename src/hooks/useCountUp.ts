import { useState, useEffect, useRef } from "react";

export function useCountUp(end: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = prevEnd.current;
    prevEnd.current = end;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setValue(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [end, duration]);

  return decimals === 0 ? Math.round(value) : parseFloat(value.toFixed(decimals));
}
