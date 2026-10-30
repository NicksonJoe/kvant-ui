import { Avatar, AvatarGroup } from '@/kvant';

const team = ['Анна Северова', 'Пётр Савин', 'Дарья Ким', 'Игорь Лебедев', 'Вера Ананьева', 'Максим Орлов'];

export default function AvatarTeam() {
  return (
    <div className="flex items-center gap-3">
      <AvatarGroup max={3} size={32}>
        {team.map((name) => (
          <Avatar key={name} name={name} size={32} />
        ))}
      </AvatarGroup>
      <span className="text-body-sm text-fg-2">6 человек в проекте</span>
    </div>
  );
}
