import { useEffect, useState } from 'react';
import { Progress } from '@/kvant';

export default function ProgressImport() {
  const [value, setValue] = useState(12);
  useEffect(() => {
    const timer = setInterval(() => setValue((current) => (current >= 100 ? 12 : Math.min(100, current + 9))), 700);
    return () => clearInterval(timer);
  }, []);

  return <Progress label="Импорт контактов" value={value} className="w-80" />;
}
