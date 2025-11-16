import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

const billSchema = z.object({
  id: z.string().min(1, 'Bill id is required'),
  title: z.string().min(3, 'Bill title is required'),
  summary: z.string().min(30, 'Bill summary must be descriptive'),
  level: z.enum(['local', 'state', 'federal']),
  status: z.string().optional(),
  sponsor: z.string().optional(),
  url: z.string().url().optional(),
});

const stanceSchema = z.object({
  position: z.enum(['support', 'oppose']),
  reason: z.string().min(10, 'Please include a brief explanation'),
});

const representativeSchema = z.object({
  name: z.string().min(1, 'Representative name is required'),
  title: z.string().min(1, 'Representative title is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .transform((val) => val.trim())
    .pipe(z.string().email('A valid email address is required')),
});

const advocacyInputSchema = z.object({
  bill: billSchema,
  stance: stanceSchema,
  representative: representativeSchema,
  tone: z.enum(['formal', 'conversational']).default('formal'),
  senderName: z.string().optional(),
  location: z
    .object({
      city: z.string(),
      state: z.string(),
    })
    .optional(),
});

const draftSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  body: z.string().min(20, 'Body must be at least 20 characters'),
});

type DraftResult = z.infer<typeof draftSchema>;

function buildGmailLink(repEmail: string, subject: string, body: string) {
  const gmailParams = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: repEmail,
    su: subject,
    body,
  });

  const mailtoParams = new URLSearchParams({
    subject,
    body,
  });

  return {
    gmailComposeUrl: `https://mail.google.com/mail/?${gmailParams.toString()}`,
    mailto: `mailto:${encodeURIComponent(repEmail)}?${mailtoParams.toString()}`,
  };
}

export const advocacyRouter = router({
  draftEmail: publicProcedure
    .input(advocacyInputSchema)
    .mutation(async ({ input }) => {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Missing OPENROUTER_API_KEY',
        });
      }

      try {
        const openrouter = createOpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY,
        });

        const locationText = input.location
          ? `${input.location.city}, ${input.location.state}`
          : 'the constituent’s community';

        const toneText = input.tone === 'conversational' ? 'conversational yet respectful' : 'formal and respectful';
        const stanceLabel = input.stance.position === 'support' ? 'support' : 'oppose';

        const { object } = await generateObject({
          model: openrouter('openai/gpt-4o-mini:online'),
          schema: draftSchema,
          messages: [
            {
              role: 'system',
              content:
                'You are a civic outreach assistant drafting concise, constituent-friendly emails to elected representatives. Keep language clear, actionable, and respectful.',
            },
            {
              role: 'user',
              content: `Bill: ${input.bill.title}
Level: ${input.bill.level}
Status: ${input.bill.status ?? 'Not provided'}
Sponsor: ${input.bill.sponsor ?? 'Not provided'}
Summary: ${input.bill.summary}
Link: ${input.bill.url ?? 'N/A'}

Representative: ${input.representative.name} (${input.representative.title})
Constituent stance: ${stanceLabel}
Reason: ${input.stance.reason}
Location: ${locationText}
Desired tone: ${toneText}
Sender name (if provided): ${input.senderName ?? 'Not provided'}

Return a subject line and full email body that the constituent can copy into Gmail. The body should include a short intro referencing the bill, a brief explanation of the stance, and a specific request for action.`,
            },
          ],
        });

        const subject = object.subject.trim();
        const body = object.body.trim();

        const { gmailComposeUrl, mailto } = buildGmailLink(input.representative.email, subject, body);

        /**
         * Returned fields:
         * - subject: AI-generated subject line.
         * - body: AI-generated email body ready to send.
         * - gmailComposeUrl: Prefilled Gmail compose link.
         * - mailto: Mailto fallback with encoded subject/body.
         */
        return {
          subject,
          body,
          gmailComposeUrl,
          mailto,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'BAD_GATEWAY',
          message: `Failed to generate advocacy email: ${error instanceof Error ? error.message : 'Unknown error'}`,
          cause: error,
        });
      }
    }),
});


