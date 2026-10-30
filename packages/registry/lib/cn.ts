export type ClassValue = string | false | null | undefined;

/** Joins class names. No conflict merging: className props are for layout, not for overriding a recipe. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
