import axios from 'axios';

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

if (!CEREBRAS_API_KEY) {
  throw new Error('Missing CEREBRAS_API_KEY environment variable');
}

export const cerebras = async function*(messages: any[], options = {}) {
  try {
    const response = await axios.post(
      'https://api.cerebras.ai/v1/chat/completions',
      {
        ...options,
        messages,
        stream: true
      },
      {
        headers: {
          authorization: `Bearer ${CEREBRAS_API_KEY}`
        },
        responseType: 'stream'
      }
    );

    for await (const chunk of response.data) {
      const text = chunk.toString();
      if (text.trim()) {
        try {
          const json = JSON.parse(text.replace('data: ', ''));
          if (json.choices?.[0]?.delta?.content) {
            yield json.choices[0].delta.content;
          }
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }
    }
  } catch (error) {
    console.error('Cerebras API error:', error);
    throw error;
  }
}; 