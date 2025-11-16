import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { dataSource } from '../db';
import { NewsletterSubscriber } from '../orm/entities/NewsletterSubscriber';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const confirmSchema = z.object({
  token: z.string().min(1, 'Confirmation token is required'),
});

export const newsletterRouter = router({
  subscribe: publicProcedure
    .input(subscribeSchema)
    .mutation(async ({ input }) => {
      if (!process.env.SENDGRID_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Email service is not configured',
        });
      }

      if (!process.env.SENDGRID_FROM_EMAIL) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Sender email is not configured',
        });
      }

      const subscriberRepo = dataSource.getRepository(NewsletterSubscriber);

      // Check if email already exists
      const existing = await subscriberRepo.findOne({
        where: { email: input.email },
      });

      if (existing) {
        if (existing.confirmed) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'This email is already subscribed',
          });
        }
        // Resend confirmation if not confirmed
        const confirmationToken = existing.confirmationToken || crypto.randomBytes(32).toString('hex');
        existing.confirmationToken = confirmationToken;
        await subscriberRepo.save(existing);

        await sendConfirmationEmail(input.email, confirmationToken, input.zipCode);

        return {
          success: true,
          message: 'Confirmation email resent. Please check your inbox.',
        };
      }

      // Create new subscriber
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const subscriber = subscriberRepo.create({
        email: input.email,
        zipCode: input.zipCode,
        city: input.city,
        state: input.state,
        confirmed: false,
        confirmationToken,
      });

      await subscriberRepo.save(subscriber);

      // Send confirmation email
      await sendConfirmationEmail(input.email, confirmationToken, input.zipCode);

      return {
        success: true,
        message: 'Please check your email to confirm your subscription.',
      };
    }),

  confirm: publicProcedure
    .input(confirmSchema)
    .mutation(async ({ input }) => {
      const subscriberRepo = dataSource.getRepository(NewsletterSubscriber);

      const subscriber = await subscriberRepo.findOne({
        where: { confirmationToken: input.token },
      });

      if (!subscriber) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid confirmation token',
        });
      }

      if (subscriber.confirmed) {
        return {
          success: true,
          message: 'Email already confirmed',
        };
      }

      subscriber.confirmed = true;
      subscriber.confirmedAt = new Date();
      subscriber.confirmationToken = null;

      await subscriberRepo.save(subscriber);

      return {
        success: true,
        message: 'Email confirmed successfully! You are now subscribed.',
      };
    }),
});

async function sendConfirmationEmail(
  email: string,
  token: string,
  zipCode?: string
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const confirmationUrl = `${frontendUrl}/newsletter/confirm?token=${token}`;

  const locationText = zipCode ? ` for ZIP ${zipCode}` : '';

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject: 'Confirm Your Civic Newsletter Subscription',
    text: `
Thank you for subscribing to civic updates${locationText}!

Please confirm your email address by clicking the link below:

${confirmationUrl}

If you didn't sign up for this newsletter, you can safely ignore this email.

Best regards,
The Civic Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-top: 3px solid #1a1a1a;
      border-bottom: 3px solid #1a1a1a;
      padding: 20px 0;
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #1a1a1a;
      color: white;
      text-decoration: none;
      text-transform: uppercase;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      border: 2px solid #1a1a1a;
      font-family: 'Courier New', monospace;
    }
    .footer {
      border-top: 1px solid #999;
      padding-top: 20px;
      font-size: 12px;
      color: #666;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Civic Newsletter</h1>
  </div>
  
  <div class="content">
    <p>Thank you for subscribing to civic updates${locationText}!</p>
    
    <p>Please confirm your email address by clicking the button below:</p>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="${confirmationUrl}" class="button">Confirm Subscription</a>
    </p>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; font-size: 12px;">${confirmationUrl}</p>
  </div>
  
  <div class="footer">
    <p>If you didn't sign up for this newsletter, you can safely ignore this email.</p>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to send confirmation email',
      cause: error,
    });
  }
}

