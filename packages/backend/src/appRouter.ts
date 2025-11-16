import { router } from './trpc';
import { pingRouter } from './routes/ping';
import { communityRouter } from './routes/community';
import { openstatesRouter } from './routes/openstates';

export const appRouter = router({
  ping: pingRouter,
  community: communityRouter,
  openstates: openstatesRouter,
});

export type AppRouter = typeof appRouter;
