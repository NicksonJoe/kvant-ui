import { useEffect, useState } from 'react';

/** Copy to the clipboard; `copied` stays true for 2 s (icon → check). A blocked clipboard leaves it false. */
export function useCopy(): [copied: boolean, copy: (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // no permission or insecure context: the icon simply does not turn into a check
      setCopied(false);
    }
  };

  return [copied, copy];
}
