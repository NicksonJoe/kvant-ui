import { useState } from 'react';
import { CanvasCommentPin, CanvasCommentThread, CanvasCursor, CanvasEditingLabel, CanvasPresence, CanvasSticky, presenceRing, type CanvasComment } from '@/kvant';

const card = 'absolute flex w-[180px] flex-col rounded-md bg-surface-1 px-3 py-2.5 text-body-xs font-semibold text-fg-1 shadow-[0_0_0_1px_var(--color-border)]';

// The engine puts these in its graph layer; here a plain relative box stands in for it.
export default function CanvasTogether() {
  const [open, setOpen] = useState(true);
  const [resolved, setResolved] = useState(false);
  const [comments, setComments] = useState<CanvasComment[]>([
    { id: '1', author: 'Анна', time: '10 мин назад', text: 'Порог 50 000 не слишком высокий для повторных?' },
    { id: '2', author: 'Игорь', time: '2 мин назад', text: 'Сделаю отдельную ветку для повторных — 30 000.' },
  ]);
  return (
    <div className="relative h-[420px] w-full max-w-[650px] overflow-hidden rounded-xl bg-background shadow-[inset_0_0_0_1px_var(--color-hairline)]">
      <CanvasPresence
        className="absolute top-5 left-5"
        people={[
          { id: 'anna', name: 'Анна', presence: 1 },
          { id: 'igor', name: 'Игорь', presence: 2 },
        ]}
      />
      <CanvasEditingLabel name="Игорь" presence={2} x={20} y={68} />
      <div className={card} style={{ left: 20, top: 90, ...presenceRing(2) }}>
        Разобрать заявку
      </div>
      <div className={card} style={{ left: 230, top: 90 }}>
        Есть бюджет?
      </div>
      {resolved ? null : <CanvasCommentPin author="Анна" count={comments.length} x={300} y={50} aria-expanded={open} onClick={() => setOpen((value) => !value)} />}
      {open && !resolved ? (
        <CanvasCommentThread
          aria-label="Комментарии к «Есть бюджет?»"
          x={230}
          y={150}
          comments={comments}
          onReply={(text) => setComments((list) => [...list, { id: String(list.length + 1), author: 'Вы', time: 'только что', text }])}
          onResolve={() => setResolved(true)}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <CanvasSticky author="Анна" time="2 мин назад" x={20} y={250}>
        Порог бюджета согласовать с Игорем — может, 30 000 ₽ для повторных клиентов?
      </CanvasSticky>
      <CanvasCursor name="Анна" presence={1} x={540} y={300} />
    </div>
  );
}
