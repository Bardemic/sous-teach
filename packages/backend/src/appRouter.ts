import { router } from './trpc';
import { pingRouter } from './routes/ping';
import { communityRouter } from './routes/community';
import { openstatesRouter } from './routes/openstates';
import { advocacyRouter } from './routes/advocacy';

export const appRouter = router({
  ping: pingRouter,
  community: communityRouter,
  openstates: openstatesRouter,
  advocacy: advocacyRouter,
});

export type AppRouter = typeof appRouter;
