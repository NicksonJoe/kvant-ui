import { Tabs, TabsList, TabsPanel, TabsTab } from '@/kvant';

export default function TabsUnderline() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList>
        <TabsTab value="overview">Обзор</TabsTab>
        <TabsTab value="tasks">Задачи</TabsTab>
        <TabsTab value="files">Файлы</TabsTab>
        <TabsTab value="history" disabled>
          История
        </TabsTab>
      </TabsList>
      <TabsPanel value="overview" className="text-body-sm text-fg-2">
        Айдентика для пекарни «Хлебница»: логотип, упаковка и вывеска. Бюджет 1 284 900 ₽.
      </TabsPanel>
      <TabsPanel value="tasks" className="text-body-sm text-fg-2">
        Три задачи: созвон по смете, отправить договор, согласовать эскизы.
      </TabsPanel>
      <TabsPanel value="files" className="text-body-sm text-fg-2">
        Бриф.pdf, Смета.xlsx и 12 эскизов.
      </TabsPanel>
    </Tabs>
  );
}
