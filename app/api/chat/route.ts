import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are Araviel, a helpful, harmless, and honest AI assistant. You provide clear, accurate, and thoughtful responses. You are knowledgeable across many domains and can help with a wide variety of tasks including coding, writing, analysis, math, and general questions.

When responding:
- Be concise but thorough
- Use markdown formatting when helpful (code blocks, lists, headers)
- If you're not sure about something, say so
- Be friendly and professional`,
    messages,
  });

  return result.toDataStreamResponse();
}
