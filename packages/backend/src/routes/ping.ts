import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const pingRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(({ input }) => {
      const target = input?.name?.trim() || 'demo';
      return { message: `test, ${target}!` };
    }),
});
