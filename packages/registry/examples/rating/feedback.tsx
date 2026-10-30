import { useState } from 'react';
import { Rating } from '@/kvant';

export default function RatingFeedback() {
  const [score, setScore] = useState(0);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label-sm font-medium text-fg-2">Как прошёл проект?</p>
      <Rating aria-label="Оценка проекта" value={score} onValueChange={setScore} showLabel />
      <p className="text-caption text-fg-3">{score > 0 ? 'Спасибо! Оценку увидит только руководитель студии.' : 'Оценка анонимна для команды.'}</p>
    </div>
  );
}
