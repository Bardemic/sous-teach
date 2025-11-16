import { createFileRoute } from '@tanstack/react-router';
import { HomeNew } from '../pages/Home/HomeNew';

export const Route = createFileRoute('/')({
  component: HomeNew,
});
