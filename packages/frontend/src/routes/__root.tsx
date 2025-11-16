import { useState } from 'react';
import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router';
import { Layout } from '../components/Layout';
import { UploadPanel } from '../components/UploadPanel/UploadPanel';

function RootComponent() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const routerState = useRouterState();

  // Hide header on home, civic, and games pages for clean newspaper look
  const showHeader = ![
    '/',
    '/civic',
    '/games',
    '/games/daily-quiz',
    '/games/connections',
    '/games/fact-or-fiction',
  ].includes(routerState.location.pathname);

  return (
    <>
      <Layout showHeader={showHeader} onUploadClick={() => setIsUploadOpen(true)}>
        <Outlet />
      </Layout>
      <UploadPanel isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
