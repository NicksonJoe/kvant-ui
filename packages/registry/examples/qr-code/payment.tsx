import { Download } from 'lucide-react';
import { Button, CopyButton, QrCode, qrCodeToDataUrl } from '@/kvant';

const link = 'norda.cloud/pay/7Kx2-318';

export default function QrCodePayment() {
  const download = () => {
    const anchor = document.createElement('a');
    anchor.href = qrCodeToDataUrl(`https://${link}`);
    anchor.download = 'oplata-scheta-318.png';
    anchor.click();
  };

  return (
    <div className="flex w-160 max-w-full flex-wrap gap-6 rounded-xl bg-surface-1 p-6 shadow-raised">
      <QrCode value={`https://${link}`} aria-label="QR-код: оплата счёта № 318" />
      <div className="flex min-w-60 flex-1 flex-col gap-4 pt-1">
        <div className="flex flex-col gap-1">
          <h3 className="text-body-lg font-semibold text-fg-1">Оплата счёта № 318</h3>
          <p className="text-body-sm text-fg-2">«Студия Север» · 312 500 ₽. Наведите камеру телефона — откроется страница оплаты через СБП.</p>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-full bg-surface-2 pr-1 pl-3.5 shadow-[inset_0_0_0_1px_var(--color-border)]">
          <span className="min-w-0 flex-1 truncate font-mono text-body-xs text-fg-1">{link}</span>
          <CopyButton value={`https://${link}`} label="Копировать" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" leadingIcon={<Download aria-hidden />} onClick={download}>
            Скачать PNG
          </Button>
          <span className="text-body-xs text-fg-3">Действует до 9 ноября, 23:59</span>
        </div>
      </div>
    </div>
  );
}
