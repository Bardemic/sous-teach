import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@sous-chef/api-types';

export const trpc = createTRPCReact<AppRouter>();
