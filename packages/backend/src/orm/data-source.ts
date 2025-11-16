import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from './entities/User';
import { NewsletterSubscriber } from './entities/NewsletterSubscriber';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'souschef',
  schema: 'public',
  synchronize: false,
  logging: false,
  entities: [User, NewsletterSubscriber],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'typeorm_migrations',
});
