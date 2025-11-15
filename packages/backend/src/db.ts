import 'reflect-metadata';
import { AppDataSource } from './orm/data-source';

export const dataSource = AppDataSource;

export async function ensureDataSourceInitialized(): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
}
