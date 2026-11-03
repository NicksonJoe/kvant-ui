import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/kvant';

/** Scales its content to fit the box: shrinks thumbnails and state cells, enlarges specimens up to `max`. */
export function FitScale({ children, className, max = 1 }: { children: ReactNode; className?: string; max?: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const box = getComputedStyle(outer);
      const width = outer.clientWidth - parseFloat(box.paddingLeft) - parseFloat(box.paddingRight);
      const height = outer.clientHeight - parseFloat(box.paddingTop) - parseFloat(box.paddingBottom);
      const next = Math.min(max, width / inner.offsetWidth, height / inner.offsetHeight);
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    });
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [max]);

  return (
    // flex, not grid: an auto grid track grows to the wide content and pins it to the start; flex centres the overflow on both sides
    <div ref={outerRef} className={cn('flex items-center justify-center overflow-hidden', className)}>
      <div ref={innerRef} className="w-max shrink-0" style={{ scale }}>
        {children}
      </div>
    </div>
  );
}
