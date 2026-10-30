import { Tabs, TabsList, TabsPanel, TabsTab } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  render: (p) => (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList variant={p.pick('variant', ['underline', 'pills'] as const)} activateOnFocus={p.bool('activateOnFocus')}>
        <TabsTab value="overview">Обзор</TabsTab>
        <TabsTab value="tasks">Задачи</TabsTab>
        <TabsTab value="files">Файлы</TabsTab>
      </TabsList>
      <TabsPanel value="overview" className="text-body-sm text-fg-2">Сводка по сделке.</TabsPanel>
      <TabsPanel value="tasks" className="text-body-sm text-fg-2">Три открытые задачи.</TabsPanel>
      <TabsPanel value="files" className="text-body-sm text-fg-2">Бриф и смета.</TabsPanel>
    </Tabs>
  ),
  code: (p) => `<Tabs defaultValue="overview">
  <TabsList${p.attrs(['variant', 'activateOnFocus'])}>
    <TabsTab value="overview">Обзор</TabsTab>
    <TabsTab value="tasks">Задачи</TabsTab>
    <TabsTab value="files">Файлы</TabsTab>
  </TabsList>
  <TabsPanel value="overview">Сводка по сделке.</TabsPanel>
  <TabsPanel value="tasks">Три открытые задачи.</TabsPanel>
  <TabsPanel value="files">Бриф и смета.</TabsPanel>
</Tabs>`,
};

export default playground;
