import { Tabs, TabsList, TabsTab } from '@/kvant';

export default function TabsPills() {
  return (
    <Tabs defaultValue="all">
      <TabsList variant="pills">
        <TabsTab value="all">Все</TabsTab>
        <TabsTab value="mine">Мои</TabsTab>
        <TabsTab value="overdue">Просроченные</TabsTab>
        <TabsTab value="archive">Архив</TabsTab>
      </TabsList>
    </Tabs>
  );
}
