import { createFileRoute } from '@tanstack/react-router';
import { Games } from '../pages/Games/Games';

export const Route = createFileRoute('/games')({
  component: Games,
});
