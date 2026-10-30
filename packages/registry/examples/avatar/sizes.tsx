import { Avatar } from '@/kvant';

export default function AvatarSizes() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar name="Анна Северова" size={20} />
      <Avatar name="Пётр Савин" size={24} />
      <Avatar name="Ольга Миронова" size={28} status="busy" />
      <Avatar name="Дарья Ким" size={32} status="online" />
      <Avatar name="Игорь Лебедев" size={40} status="away" />
      <Avatar name="Вера Ананьева" size={48} status="offline" />
      <Avatar name="Максим Орлов" size={64} status="online" />
    </div>
  );
}
