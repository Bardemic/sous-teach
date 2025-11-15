import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { emailOTP, lastLoginMethod } from 'better-auth/plugins';
import { Pool } from 'pg';
import mail from '@sendgrid/mail';

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
  },
  plugins: [
    lastLoginMethod(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const apiKey = process.env.SENDGRID_API_KEY;
        const from = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM;
        if (!apiKey || !from) {
          console.log('[email-otp] Missing SENDGRID configuration');
          return;
        }
        try {
          mail.setApiKey(apiKey);
          const subject =
            type === 'sign-in'
              ? 'Your Sous Chef sign-in code'
              : type === 'email-verification'
              ? 'Verify your email'
              : 'Reset your Sous Chef password';
          const text = `Your verification code is ${otp}. It expires in 5 minutes.`;
          await mail.send({ to: email, from, subject, text });
        } catch (error) {
          console.log(`[email-otp] Error sending OTP email to ${email}`, error);
        }
      },
      otpLength: 6,
      expiresIn: 300,
      overrideDefaultEmailVerification: true,
    }),
  ],
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:7000'],
});
