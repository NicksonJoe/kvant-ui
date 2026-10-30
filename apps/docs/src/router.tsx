import { Navigate, createBrowserRouter } from 'react-router';
import { ComponentsNav, DocsNav } from './components/SectionNav';
import { RootLayout } from './layouts/RootLayout';
import { SidebarLayout } from './layouts/SidebarLayout';
import { BlocksPage } from './pages/BlocksPage';
import { CheckPage } from './pages/CheckPage';
import { ComponentRoute } from './pages/ComponentPage';
import { ComponentsIndex } from './pages/ComponentsIndex';
import { DocRoute } from './pages/docs/DocPage';
import { NotFound } from './pages/NotFound';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { ThemesPage } from './pages/ThemesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/docs" replace /> },
      {
        path: 'docs',
        element: <SidebarLayout nav={<DocsNav />} />,
        children: [
          { index: true, element: <DocRoute /> },
          { path: ':slug', element: <DocRoute /> },
        ],
      },
      {
        path: 'components',
        element: <SidebarLayout nav={<ComponentsNav />} />,
        children: [
          { index: true, element: <ComponentsIndex /> },
          { path: ':id', element: <ComponentRoute /> },
        ],
      },
      { path: 'blocks', element: <BlocksPage /> },
      { path: 'themes', element: <ThemesPage /> },
      { path: 'check', element: <CheckPage /> },
      {
        path: '*',
        element: (
          <main id="content">
            <NotFound />
          </main>
        ),
      },
    ],
  },
  // a full-screen app with its own bar, outside the docs layout
  { path: '/playground', element: <PlaygroundPage /> },
]);
