import { Mail, Phone, Send } from 'lucide-react';
import { Select } from '@/kvant';

export default function SelectIcons() {
  return (
    <Select
      aria-label="Канал связи"
      placeholder="Канал связи"
      className="w-72"
      options={[
        { value: 'phone', label: 'Телефон', icon: <Phone /> },
        { value: 'email', label: 'Почта', icon: <Mail /> },
        { value: 'telegram', label: 'Telegram', icon: <Send /> },
      ]}
    />
  );
}
