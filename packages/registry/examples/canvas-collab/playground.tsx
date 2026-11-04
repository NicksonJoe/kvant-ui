import { CanvasCommentThread } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { 'aria-label': 'Комментарии к «Есть бюджет?»' },
  render: (p) => (
    <CanvasCommentThread
      aria-label={p.text('aria-label')}
      comments={[
        { id: '1', author: 'Анна', time: '10 мин назад', text: 'Порог 50 000 не слишком высокий для повторных?' },
        { id: '2', author: 'Игорь', time: '2 мин назад', text: 'Сделаю отдельную ветку для повторных — 30 000.' },
      ]}
      onReply={() => {}}
      onResolve={() => {}}
    />
  ),
  code: (p) => `<CanvasCommentThread${p.attrs(['aria-label'])} comments={comments} onReply={reply} onResolve={resolve} x={230} y={158} />`,
};

export default playground;
