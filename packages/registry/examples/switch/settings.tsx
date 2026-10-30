import { useState } from 'react';
import { Card, Separator, Switch } from '@/kvant';

export default function SwitchSettings() {
  const [links, setLinks] = useState(false);
  const [saving, setSaving] = useState(false);

  // Stands in for the server: the switch moves only after the answer.
  const toggleLinks = (next: boolean) => {
    setSaving(true);
    window.setTimeout(() => {
      setLinks(next);
      setSaving(false);
    }, 1200);
  };

  return (
    <Card className="w-104 max-w-full">
      <div className="flex flex-col gap-3.5">
        <Switch defaultChecked description="Код из приложения-аутентификатора при каждом входе">
          Двухфакторный вход
        </Switch>
        <Separator />
        <Switch description="Ссылка действует 15 минут">Вход по ссылке из письма</Switch>
        <Separator />
        <Switch
          checked={links}
          loading={saving}
          onCheckedChange={toggleLinks}
          description={saving ? 'Сохраняем…' : 'Отчёт открывается по ссылке без входа'}
        >
          Публичные ссылки на отчёты
        </Switch>
        <Separator />
        <Switch disabled description="Доступно на тарифе «Студия»">
          Единый вход через SSO
        </Switch>
      </div>
    </Card>
  );
}
