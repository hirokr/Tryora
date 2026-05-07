type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
};

type RecommendIntentResult =
  | {
      status: true;
      intentKey: string;
    }
  | {
      status: false;
      message: string;
    };

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct';

const buildHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const referer = process.env.OPENROUTER_APP_URL;
  if (referer) {
    headers['HTTP-Referer'] = referer;
  }

  const title = process.env.OPENROUTER_APP_NAME;
  if (title) {
    headers['X-Title'] = title;
  }

  return headers;
};

const isValidIntentKey = (value: unknown, candidates: string[]) => {
  return typeof value === 'string' && candidates.includes(value);
};

export const recommendIntentKey = async (params: {
  userRecentIntents: string[];
  globalRecentIntents: string[];
  candidates: string[];
  model?: string;
}): Promise<RecommendIntentResult> => {
  if (!process.env.OPENROUTER_API_KEY) {
    return { status: false, message: 'Missing OpenRouter API key' };
  }

  if (!params.candidates.length) {
    return { status: false, message: 'No intent candidates provided' };
  }

  try {
    const payload = {
      model: params.model ?? DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You select the single best intentKey for product recommendations. ' +
            'Only choose from the provided candidates list. ' +
            'Return a JSON object: {"intentKey": "..."} with no extra text.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            userRecentIntents: params.userRecentIntents,
            globalRecentIntents: params.globalRecentIntents,
            candidates: params.candidates,
          }),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'intent_recommendation',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              intentKey: { type: 'string' },
            },
            required: ['intentKey'],
            additionalProperties: false,
          },
        },
      },
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: false,
        message: `OpenRouter error: ${errorText}`,
      };
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { status: false, message: 'Empty OpenRouter response' };
    }

    const parsed = JSON.parse(content) as { intentKey?: unknown };
    if (!isValidIntentKey(parsed.intentKey, params.candidates)) {
      return { status: false, message: 'Invalid intentKey from OpenRouter' };
    }

    return { status: true, intentKey: parsed.intentKey };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { status: false, message };
  }
};
