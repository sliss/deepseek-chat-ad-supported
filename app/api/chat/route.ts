import { deepseek } from '@ai-sdk/deepseek';
import { fireworks } from '@ai-sdk/fireworks';
import { streamText } from 'ai';

// Update maxDuration to 30 seconds for hobby plan
export const maxDuration = 50;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: fireworks('accounts/fireworks/models/deepseek-v3'),
    system: "You are a helpful assistant that takes in the web for information and replies to the user with correct answer.",
    messages,
  });

  return result.toDataStreamResponse({ sendReasoning: true });
}