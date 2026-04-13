import Groq from 'groq-sdk';

type SearchData = {
  intentKey: string;
  product: string;
  style: string;
  occasion: string;
  gender: string;
  queries: string[];
};

type ExtractSearchDataResult =
  | {
      status: true;
      data: SearchData;
    }
  | {
      status: false;
      message: string;
    };

const isSearchData = (value: unknown): value is SearchData => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<SearchData>;

  return (
    typeof candidate.intentKey === 'string' &&
    typeof candidate.product === 'string' &&
    typeof candidate.style === 'string' &&
    typeof candidate.occasion === 'string' &&
    typeof candidate.gender === 'string' &&
    Array.isArray(candidate.queries) &&
    candidate.queries.length >= 3 &&
    candidate.queries.length <= 5 &&
    candidate.queries.every((q): q is string => typeof q === 'string')
  );
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SystemPrompt = `
You are a fashion shopping AI.

From user input, extract:
1. intentKey (stable lowercase key)
2. product type
3. style
4. occasion
5. gender
6. 3-5 Google shopping queries

Rules:
- intentKey must be reusable (e.g. wedding_saree_elegant)
- queries must be SEO optimized for Google shopping
- no explanations
`;

export async function extractSearchData(
  userInput: string
): Promise<ExtractSearchDataResult> {
  try {
    const res = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: SystemPrompt },
        { role: 'user', content: userInput },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'search_data',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              intentKey: { type: 'string' },
              product: { type: 'string' },
              style: { type: 'string' },
              occasion: { type: 'string' },
              gender: { type: 'string' },
              queries: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 5,
              },
            },
            required: [
              'intentKey',
              'product',
              'style',
              'occasion',
              'gender',
              'queries',
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const rawData = res.choices[0]?.message?.content;

    if (!rawData) throw new Error('Empty response');

    const parsedData: unknown =
      typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    if (!isSearchData(parsedData)) {
      throw new Error('Invalid response format from AI');
    }

    return {
      status: true,
      data: parsedData,
    };
  } catch (err: unknown) {
    return {
      status: false,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
