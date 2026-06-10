import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  decimals?: number;
  format?: (n: number) => string;
  /** Skip the animation entirely (e.g. when value is 0 / em-dash). */
  skip?: boolean;
};

/**
 * Eases a number from its previous rendered value to the next, on
 * every commit. Uses ease-out-expo. No external lib.
 */
export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  format,
  skip = false,
}: Props) {
  const [display, setDisplay] = useState(skip ? value : 0);
  const fromRef = useRef(skip ? value : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (skip) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    if (value === fromRef.current) return;

    const from = fromRef.current;
    const to = value;
    let start: number | null = null;

    const tick = (t: number) => {
      if (start === null) start = t;
      const elapsed = t - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, skip]);

  const out = format
    ? format(display)
    : display.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  return <>{out}</>;
}
