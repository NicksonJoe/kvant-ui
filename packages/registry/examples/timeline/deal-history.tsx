import { ArrowRight, FileText } from 'lucide-react';
import { Badge, Timeline, TimelineDay, TimelineItem } from '@/kvant';

export default function TimelineDealHistory() {
  return (
    <div className="w-full max-w-xl rounded-xl bg-surface-1 p-6 shadow-raised">
      <Timeline>
        <TimelineDay label="Сегодня">
          <TimelineItem
            time="14:32"
            dateTime="2026-10-29T14:32"
            latest
            details={
              <>
                <Badge>Бриф</Badge>
                <ArrowRight aria-hidden className="size-3.5 text-fg-3" />
                <Badge tone="info">Договор</Badge>
              </>
            }
          >
            <b>Анна Северова</b> перевела сделку в следующий этап
          </TimelineItem>
          <TimelineItem time="12:05" dateTime="2026-10-29T12:05" description="184 000 ₽ · по счёту, платёжное поручение № 512">
            Оплачен счёт <b>№ 24-117</b>
          </TimelineItem>
          <TimelineItem
            time="10:47"
            dateTime="2026-10-29T10:47"
            details={<p className="rounded-lg bg-surface-2 px-3.5 py-2.5 text-body-sm text-fg-1">Клиент просит ускорить запуск — обсудим на планёрке в четверг.</p>}
          >
            <b>Дмитрий Ковалёв</b> оставил комментарий
          </TimelineItem>
        </TimelineDay>
        <TimelineDay label="Вчера">
          <TimelineItem
            time="18:20"
            dateTime="2026-10-28T18:20"
            details={
              <a href="#brief" className="inline-flex h-8 items-center gap-2 rounded-full px-3 text-label-sm font-medium text-fg-1 shadow-control hover:bg-control-hover">
                <FileText aria-hidden className="size-4 stroke-[1.75] text-fg-2" />
                Бриф_Полюс.pdf
                <span className="font-regular text-fg-3">2,4 МБ</span>
              </a>
            }
          >
            <b>Мария Лебедева</b> загрузила файл
          </TimelineItem>
          <TimelineItem time="16:03" dateTime="2026-10-28T16:03" description="Форма «Обсудить проект» · ответственная назначена автоматически">
            Сделка создана из заявки с сайта
          </TimelineItem>
        </TimelineDay>
        <TimelineDay label="27 октября">
          <TimelineItem time="11:15" dateTime="2026-10-27T11:15">
            <b>Анна Северова</b> добавила клиента <b>«Студия Север»</b>
          </TimelineItem>
        </TimelineDay>
      </Timeline>
    </div>
  );
}
