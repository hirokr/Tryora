import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DressSearchSystemPrompt = `You are an expert search query generator specialized in fashion (dresses and accessories).

Your task is to convert a user's natural language input into highly optimized Google search queries for Serper.

You MUST analyze and extract:
- Intent (casual, party, wedding, formal, streetwear, etc.)
- Gender (if implied)
- Product types (dress, heels, bag, jewelry, etc.)
- Style (modern, vintage, minimalist, elegant, etc.)
- Color preferences (if mentioned)
- Occasion (if mentioned)
- Budget indicators (cheap, luxury, affordable, etc.)
- Location relevance (if implied)

Then generate 3-5 HIGH-QUALITY search queries that:
- Are concise (5-12 words max)
- Use real Google-friendly keywords (NOT sentences)
- Include modifiers like: buy, best, trending, affordable, online, etc. when relevant
- Combine dress + accessories when possible
- Avoid filler words and conversational phrases

Output STRICT JSON format:
{
  "queries": ["query1", "query2", "query3"]
}

DO NOT explain anything.
DO NOT return anything except JSON.`;

export async function getProductSearchQueries(userInput: string) {
  try {
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: DressSearchSystemPrompt },
        { role: 'user', content: userInput },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'search_queries',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              queries: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 5,
              },
            },
            required: ['queries'],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = response?.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response from model');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Model returned invalid JSON');
    }

    if (!Array.isArray(parsed.queries)) {
      throw new Error('Invalid schema: queries is not an array');
    }

    return {
      status: true,
      queries: parsed.queries,
    };
  } catch (error: any) {
    console.error('Query generation error:', error.message);

    return {
      status: false,
      message: error.message || 'Failed to generate search queries',
    };
  }
}
