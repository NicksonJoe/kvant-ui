import { Ellipsis } from 'lucide-react';
import { Avatar, AvatarGroup, Badge, Button, Card, CardHeader, IconButton } from '@/kvant';

export default function CardDeal() {
  return (
    <Card className="w-96 max-w-full">
      <CardHeader
        title="Айдентика для пекарни"
        description="Пекарня «Хлебница» · до 30 октября"
        action={<IconButton size="sm" aria-label="Действия со сделкой" icon={<Ellipsis />} />}
      />
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-caption text-fg-3">Бюджет</span>
          <data value="1284900" className="text-heading-md font-semibold">
            1 284 900 ₽
          </data>
        </div>
        <Badge tone="success" variant="dot">
          Договор
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <AvatarGroup size={24}>
          <Avatar name="Анна Северова" size={24} />
          <Avatar name="Пётр Савин" size={24} />
          <Avatar name="Дарья Ким" size={24} />
        </AvatarGroup>
        <Button size="sm" variant="secondary">
          Открыть
        </Button>
      </div>
    </Card>
  );
}
