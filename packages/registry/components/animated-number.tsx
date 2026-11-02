import { useEffect, useState, type ComponentProps } from 'react';
import { cn } from '../lib/cn';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const defaultFormat = (value: number) => value.toLocaleString('ru-RU');

export interface AnimatedNumberProps extends Omit<ComponentProps<'span'>, 'children'> {
  value: number;
  /** Locale formatting; digits roll, separators and signs stay. */
  format?: (value: number) => string;
  /** Unit after the number in fg-3: « ₽», « %». It does not animate. */
  suffix?: string;
}

/**
 * Number whose changed digits roll into place (600ms ease-fluid) when the value updates in front of the reader.
 * The first render shows the value at once; tabular digits keep the width; screen readers get only the final value.
 */
export function AnimatedNumber({ value, format = defaultFormat, suffix, className, ...props }: AnimatedNumberProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const text = format(value);
  const chars = [...text];

  return (
    <span data-slot="animated-number" className={cn('inline-flex items-baseline tabular-nums', className)} {...props}>
      <span className="sr-only">{`${text}${suffix ?? ''}`}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((char, index) => {
          // keyed from the right so units stay put when the number grows a digit
          const key = chars.length - index;
          if (!DIGITS.includes(char)) return <span key={key}>{char}</span>;
          return (
            <span key={key} data-slot="animated-number-digit" data-value={char} className="relative inline-block h-[1lh] overflow-hidden">
              <span className="invisible">0</span>
              <span
                className={cn(
                  'absolute inset-x-0 top-0 flex flex-col motion-reduce:transition-none',
                  mounted && 'transition-transform duration-(--duration-deliberate) ease-fluid',
                )}
                style={{ transform: `translateY(-${Number(char) * 10}%)` }}
              >
                {DIGITS.map((digit) => (
                  <span key={digit} className="h-[1lh] text-center">
                    {digit}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      {suffix ? (
        <span aria-hidden className="whitespace-pre text-fg-3">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
