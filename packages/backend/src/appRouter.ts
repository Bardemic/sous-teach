import { router } from './trpc';
import { pingRouter } from './routes/ping';
import { communityRouter } from './routes/community';
import { openstatesRouter } from './routes/openstates';
import { newsletterRouter } from './routes/newsletter';

export const appRouter = router({
  ping: pingRouter,
  community: communityRouter,
  openstates: openstatesRouter,
  newsletter: newsletterRouter,
});

export type AppRouter = typeof appRouter;
