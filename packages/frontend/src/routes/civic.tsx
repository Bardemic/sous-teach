import { createFileRoute } from '@tanstack/react-router';
import { CivicSnapshot } from '../pages/Civic/CivicSnapshot';

export const Route = createFileRoute('/civic')({
  component: CivicSnapshot,
});
