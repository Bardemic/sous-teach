import { createFileRoute } from '@tanstack/react-router';
import { FactOrFiction } from '../../pages/Games/FactOrFiction/FactOrFiction';

export const Route = createFileRoute('/games/fact-or-fiction')({
  component: FactOrFiction,
});
