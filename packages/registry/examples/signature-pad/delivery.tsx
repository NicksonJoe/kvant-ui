import { Archive, Download, Ellipsis, PenLine, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Button,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  SignatureCard,
  SignaturePad,
  signatureToDataUrl,
  toast,
  type SignatureData,
} from '@/kvant';

interface Accepted {
  src: string;
  time: string;
}

const day = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const clock = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
/** «2 ноября 2026, 14:32». */
const stamp = (date: Date) => `${day.format(date)} ${date.getFullYear()}, ${clock.format(date)}`;
const UNDO_MS = 7000;

export default function SignaturePadDelivery() {
  const [accepted, setAccepted] = useState<Accepted | null>(null);
  const [confirm, setConfirm] = useState<'archive' | 'delete' | null>(null);

  const accept = (data: SignatureData) => {
    setAccepted({ src: signatureToDataUrl(data, { trim: true }), time: stamp(new Date()) });
  };

  // Replacing and removing hide the card at once and keep it for the «Отменить» of the toast.
  const drop = (title: string) => {
    const previous = accepted;
    setAccepted(null);
    toast.add({ title, timeout: UNDO_MS, actionProps: { children: 'Отменить', onClick: () => setAccepted(previous) } });
  };

  const download = () => {
    if (!accepted) return;
    const link = document.createElement('a');
    link.href = accepted.src;
    link.download = 'Подпись — акт 1184.png';
    link.click();
  };

  return (
    <div className="w-full max-w-160">
      {accepted ? (
        <div className="flex flex-col gap-1">
          <span className="pb-0.5 text-label-sm font-medium text-fg-2">Подпись получателя</span>
          <SignatureCard
            src={accepted.src}
            name="Ирина Котова"
            time={accepted.time}
            className="max-w-76"
            actions={
              <Menu>
                <MenuTrigger render={<IconButton aria-label="Действия с подписью" size="xs" variant="ghost" icon={<Ellipsis />} />} />
                <MenuContent align="end">
                  <MenuItem icon={<Download />} onClick={download}>
                    Скачать PNG
                  </MenuItem>
                  <MenuItem icon={<PenLine />} onClick={() => drop('Подпись заменена — старая в архиве')}>
                    Подписать заново
                  </MenuItem>
                  <MenuSeparator />
                  <MenuSub>
                    <MenuSubTrigger>Ещё</MenuSubTrigger>
                    <MenuSubContent>
                      <MenuItem icon={<Archive />} onClick={() => setConfirm('archive')}>
                        В архив…
                      </MenuItem>
                      <MenuItem icon={<Trash2 />} destructive onClick={() => setConfirm('delete')}>
                        Удалить…
                      </MenuItem>
                    </MenuSubContent>
                  </MenuSub>
                </MenuContent>
              </Menu>
            }
          />
        </div>
      ) : (
        <SignaturePad
          label="Подпись получателя"
          meta="Акт № 1184 от 2 ноября"
          signer="Ирина Котова, кладовщик"
          onAccept={accept}
          onClear={(restore) => toast.add({ title: 'Подпись очищена', timeout: UNDO_MS, actionProps: { children: 'Отменить', onClick: restore } })}
        />
      )}
      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent icon={confirm === 'delete' ? <Trash2 /> : <Archive />} tone={confirm === 'delete' ? 'danger' : 'accent'}>
          <AlertDialogTitle>{confirm === 'delete' ? 'Удалить подпись?' : 'Убрать подпись в архив?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirm === 'delete' ? 'Акт № 1184 останется без подписи получателя.' : 'Акт № 1184 снова будет ждать подписи; старая останется в архиве.'}
          </AlertDialogDescription>
          <div className="flex justify-end gap-2 pt-2">
            <AlertDialogClose render={<Button variant="secondary" />}>Отмена</AlertDialogClose>
            <AlertDialogClose
              render={<Button variant={confirm === 'delete' ? 'danger' : 'primary'} />}
              onClick={() => (confirm === 'delete' ? drop('Подпись удалена') : drop('Подпись в архиве'))}
            >
              {confirm === 'delete' ? 'Удалить' : 'В архив'}
            </AlertDialogClose>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
