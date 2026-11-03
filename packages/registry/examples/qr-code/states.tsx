import { useState } from 'react';
import { QrCode, type QrCodeState } from '@/kvant';

const cell = 'flex h-58 flex-col items-center justify-center gap-3 rounded-xl';
const surface = `${cell} bg-surface-1 shadow-raised`;

export default function QrCodeStates() {
  const [login, setLogin] = useState({ state: 'expired' as QrCodeState, token: 'Q8f2' });

  const refresh = () => {
    setLogin((current) => ({ ...current, state: 'loading' }));
    // a new code from the server
    setTimeout(() => setLogin({ state: 'ready', token: Math.random().toString(36).slice(2, 6) }), 800);
  };

  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
      <figure className={surface}>
        <QrCode
          value="https://norda.cloud/m/login"
          size="md"
          logo={<span className="grid size-full place-items-center rounded-[7px] bg-accent text-[15px]/4 font-bold text-accent-fg">Н</span>}
          aria-label="QR-код: вход в мобильную Норду"
        />
        <figcaption className="text-body-xs text-fg-2">Мобильная Норда · вход</figcaption>
      </figure>
      <figure className={surface}>
        <QrCode
          value={`https://norda.cloud/m/login?t=${login.token}`}
          size="md"
          state={login.state}
          onRefresh={refresh}
          aria-label="QR-код: вход в мобильную Норду"
        />
        <figcaption className="text-body-xs text-fg-3">
          {login.state === 'expired' ? 'Код действовал 5 минут' : login.state === 'loading' ? 'Готовим код…' : 'Действует 5 минут'}
        </figcaption>
      </figure>
      <figure className={surface}>
        <QrCode value="https://norda.cloud" size="md" state="loading" />
        <figcaption className="text-body-xs text-fg-3">Готовим код…</figcaption>
      </figure>
      <figure className={`${cell} bg-media-bg`}>
        <QrCode value="https://t.me/norda_cloud_bot?start=4821" size="md" aria-label="QR-код: Telegram-бот Норды" />
        <figcaption className="text-body-xs text-media-fg-2">Подключить Telegram-бота</figcaption>
      </figure>
    </div>
  );
}
