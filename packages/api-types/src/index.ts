import type { AppRouter as BackendAppRouter } from '../../backend/src/appRouter';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export type AppRouter = BackendAppRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
