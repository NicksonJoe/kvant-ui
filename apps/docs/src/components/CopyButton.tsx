import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IconButton, Tooltip, cn, toast } from '@/kvant';

export interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

/** Copy → check for 2 s; the swap is announced to screen readers. */
export function CopyButton({ value, label = 'Скопировать', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      toast.add({ type: 'danger', title: 'Не удалось скопировать', description: 'Браузер не дал доступ к буферу обмена' });
    }
  };

  return (
    <Tooltip content={copied ? 'Скопировано' : label}>
      <IconButton
        size="sm"
        aria-label={copied ? 'Скопировано' : label}
        className={cn('[&_svg]:transition-[scale,opacity] [&_svg]:duration-(--duration-quick)', className)}
        icon={copied ? <Check className="text-success-soft-fg" /> : <Copy />}
        onClick={copy}
      />
    </Tooltip>
  );
}
