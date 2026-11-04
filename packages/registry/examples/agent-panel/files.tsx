import { useEffect, useState } from 'react';
import { AgentFileCard, Button } from '@/kvant';

export default function AgentFiles() {
  const [progress, setProgress] = useState(33);
  useEffect(() => {
    const timer = window.setInterval(() => setProgress((value) => (value >= 100 ? 33 : value + 33)), 1500);
    return () => window.clearInterval(timer);
  }, []);
  const sheet = Math.min(3, Math.round(progress / 33));
  return (
    <div className="grid w-full max-w-[920px] gap-6 md:grid-cols-2">
      <AgentFileCard name="Оборот · октябрь 2026.xlsx" format="xlsx" meta="3 листа · 18 КБ" onDownload={() => {}} onOpen={() => {}} />
      <AgentFileCard name="Оборот · октябрь 2026.pdf" format="pdf" meta="4 страницы · 212 КБ" onDownload={() => {}} onOpen={() => {}} />
      <AgentFileCard name="Оборот · октябрь 2026.csv" format="csv" meta="7 строк · 2 КБ" onDownload={() => {}} onOpen={() => {}} />
      <AgentFileCard name="Оборот · октябрь 2026.xlsx" format="xlsx" status="preparing" progress={progress} meta={`Собираю лист «Воронка» · ${sheet} из 3`} />
      <AgentFileCard
        name="Оборот · октябрь 2026.xlsx"
        format="xlsx"
        status="error"
        error="Банк не отдал выписку за 27–29 октября"
        onRetry={() => {}}
        errorAction={
          <Button variant="ghost" size="sm">
            Собрать без них
          </Button>
        }
      />
    </div>
  );
}
