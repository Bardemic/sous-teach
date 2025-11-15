import { router } from './trpc';
import { pingRouter } from './routes/ping';

export const appRouter = router({
  ping: pingRouter,
});

export type AppRouter = typeof appRouter;
