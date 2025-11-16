import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { publicProcedure, router } from '../trpc';

const llmResponseSchema = z
  .object({
    opportunities: z
      .array(
        z.object({
          title: z.string(),
          summary: z.string(),
          organization: z.string().optional(),
          category: z.enum(['volunteer', 'nonprofit', 'donation', 'event']).optional(),
          url: z.string().url(),
          tags: z.array(z.string()).optional(),
          contact: z.string().optional(),
          nextSteps: z.string().optional(),
        }),
      )
      .min(1)
      .max(8),
    summary: z.string().optional(),
  })
  .strict();

type JsonSchemaObject = {
  type: 'object';
  [key: string]: unknown;
};

const llmResponseJsonSchemaRaw = zodToJsonSchema(llmResponseSchema, {
  name: 'CommunityOpportunities',
  target: 'jsonSchema7',
  $refStrategy: 'jsonPointer',
}) as {
  definitions?: Record<string, JsonSchemaObject>;
  $ref?: string;
};

const llmResponseJsonSchema = llmResponseJsonSchemaRaw.definitions?.CommunityOpportunities;

if (!llmResponseJsonSchema) {
  throw new Error('Failed to derive JSON schema from Zod definition');
}

const stripFormats = (node: unknown): void => {
  if (Array.isArray(node)) {
    node.forEach(stripFormats);
    return;
  }

  if (node && typeof node === 'object') {
    if ('format' in node && (node as { format?: unknown }).format === 'uri') {
      delete (node as { format?: unknown }).format;
    }
    Object.values(node).forEach(stripFormats);
  }
};

stripFormats(llmResponseJsonSchema);

const ensureRequiredArrays = (node: unknown): void => {
  if (!node || typeof node !== 'object') {
    return;
  }

  if ('type' in node && (node as { type?: unknown }).type === 'object' && 'properties' in node) {
    const objectNode = node as {
      properties?: Record<string, unknown>;
      required?: string[];
    };

    if (objectNode.properties && typeof objectNode.properties === 'object') {
      const requiredSet = new Set(objectNode.required ?? []);
      Object.keys(objectNode.properties).forEach((key) => requiredSet.add(key));
      objectNode.required = Array.from(requiredSet);

      Object.values(objectNode.properties).forEach(ensureRequiredArrays);
    }
  }

  Object.values(node).forEach(ensureRequiredArrays);
};

ensureRequiredArrays(llmResponseJsonSchema);

const inputSchema = z.object({
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State / region is required'),
  country: z.string().min(1, 'Country is required'),
  focus: z.enum(['volunteer', 'nonprofit', 'donation']).optional(),
});

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_COMMUNITY_MODEL ?? 'openai/gpt-4o-mini:online';

type LlmResponse = z.infer<typeof llmResponseSchema>;

async function fetchCommunityLeads(input: z.infer<typeof inputSchema>): Promise<LlmResponse> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Missing OPENROUTER_API_KEY',
    });
  }

  const location = `${input.city.trim()}, ${input.state.trim()}, ${input.country.trim()}`;
  const focusText = input.focus
    ? `Prioritize ${input.focus} programs.`
    : 'Cover a mix of volunteer gigs, nonprofits, donation drives, and civic events.';

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'http://localhost:5173',
      'X-Title': 'Community Civic Search Prototype',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.2,
      plugins: [
        {
          id: 'web',
          config: {
            engine: 'exa',
            max_results: 8,
          },
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'CommunityOpportunities',
          schema: llmResponseJsonSchema,
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'You are Civic Scout, an assistant that uses Exa-powered research to find actionable, verifiable community opportunities. Always cite real organizations and provide human-friendly summaries.',
        },
        {
          role: 'user',
          content: `Location: ${location}
${focusText}
Return helpful, diverse opportunities that local residents can act on this month.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unable to read error body');
    throw new TRPCError({
      code: 'BAD_GATEWAY',
      message: `OpenRouter request failed (${response.status}): ${errorBody}`,
    });
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
  };

  const content = completion.choices?.[0]?.message?.content;
  const rawText =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content
            .map((chunk) => chunk.text ?? '')
            .join('')
            .trim()
        : '';

  if (!rawText) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'OpenRouter returned an empty response',
    });
  }

  try {
    return llmResponseSchema.parse(JSON.parse(rawText));
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse OpenRouter response',
      cause: error,
    });
  }
}

export const communityRouter = router({
  search: publicProcedure.input(inputSchema).mutation(async ({ input }) => {
    const data = await fetchCommunityLeads(input);

    return {
      meta: {
        location: `${input.city}, ${input.state}, ${input.country}`,
        model: OPENROUTER_MODEL,
        generatedAt: new Date().toISOString(),
        focus: input.focus ?? 'mixed',
      },
      opportunities: data.opportunities,
      summary: data.summary,
    };
  }),
});

