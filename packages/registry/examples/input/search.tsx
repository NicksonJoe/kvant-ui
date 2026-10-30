import { Search } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/kvant';

export default function InputSearch() {
  const [query, setQuery] = useState('Студия');
  return (
    <Input
      aria-label="Поиск клиентов"
      placeholder="Поиск клиентов"
      prefix={<Search />}
      value={query}
      onValueChange={setQuery}
      onClear={() => setQuery('')}
      className="w-80"
    />
  );
}
