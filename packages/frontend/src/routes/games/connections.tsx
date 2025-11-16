import { createFileRoute } from '@tanstack/react-router';
import { Connections } from '../../pages/Games/Connections/Connections';

export const Route = createFileRoute('/games/connections')({
  component: Connections,
});
