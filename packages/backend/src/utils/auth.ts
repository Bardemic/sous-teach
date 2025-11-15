import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'souschef',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('connect', (client) => {
  client.query('SET search_path TO auth;');
});

export const auth = betterAuth({
  user: {
    additionalFields: {
      isOnboarded: {
        type: 'boolean',
        required: false,
        default: false,
      },
    },
  },
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:7000'],
});
