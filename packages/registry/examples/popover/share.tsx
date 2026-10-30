import { Link } from 'lucide-react';
import { Button, Input, Popover, PopoverContent, PopoverTitle, PopoverTrigger, Switch } from '@/kvant';

export default function PopoverShare() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" leadingIcon={<Link />} />}>Поделиться</PopoverTrigger>
      <PopoverContent align="end">
        <PopoverTitle>Доступ к смете</PopoverTitle>
        <Input readOnly aria-label="Ссылка на смету" defaultValue="norda.cloud/s/7f3k-smeta" />
        <Switch defaultChecked>Клиент может комментировать</Switch>
      </PopoverContent>
    </Popover>
  );
}
