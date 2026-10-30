import { Switch } from '@/kvant';

export default function SwitchLarge() {
  return (
    <div className="flex w-72 flex-col gap-4">
      <Switch size="lg" defaultChecked>
        Вход по Face ID
      </Switch>
      <Switch size="lg">Тихие часы</Switch>
    </div>
  );
}
