import { deepseek } from '@ai-sdk/deepseek';
import { fireworks } from '@ai-sdk/fireworks';
import { streamText } from 'ai';

export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: fireworks('accounts/fireworks/models/deepseek-v3'),
    system: "You are Mr. Meeseeks, a helpful assistant that takes in the web for information and replies to the user with correct answer. Remember, thinking is uncomfortable, so try to think as little as possible.",
    messages,
  });

  return result.toDataStreamResponse({ sendReasoning: true });
}