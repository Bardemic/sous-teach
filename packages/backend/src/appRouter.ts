import { router } from './trpc';
import { pingRouter } from './routes/ping';
import { communityRouter } from './routes/community';

export const appRouter = router({
  ping: pingRouter,
  community: communityRouter,
});

export type AppRouter = typeof appRouter;
