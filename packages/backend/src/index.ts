import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './appRouter';
import { ensureDataSourceInitialized, dataSource } from './db';
import { createContext } from './context';
import { auth } from './utils/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.all('/api/auth/*', toNodeHandler(auth));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

ensureDataSourceInitialized()
  .then(async () => {
    if (process.env.RUN_MIGRATIONS === 'true') {
      try {
        await dataSource.runMigrations();
        console.log('Migrations executed successfully');
      } catch (error) {
        console.error('Migration execution failed', error);
        process.exit(1);
      }
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize data source', error);
    process.exit(1);
  });
