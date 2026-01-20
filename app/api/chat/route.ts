import { NextRequest, NextResponse } from 'next/server';
import type { ChatRequest, ChatResponse, Model } from '@/types';

// Simple model routing logic
function routeToModel(message: string, preferredModel: string): { model: Model; reason: string } {
  // If specific model requested, use it
  if (preferredModel !== 'auto') {
    const reasons: Record<string, string> = {
      claude: 'You selected Claude for this conversation.',
      gpt4: 'You selected GPT-4 for this conversation.',
      gemini: 'You selected Gemini for this conversation.',
      perplexity: 'You selected Perplexity for this conversation.',
    };
    return {
      model: preferredModel as Model,
      reason: reasons[preferredModel] || 'Model selected by user.',
    };
  }

  // Auto-routing based on content
  const lowerMessage = message.toLowerCase();

  // Code-related queries
  if (
    lowerMessage.includes('code') ||
    lowerMessage.includes('function') ||
    lowerMessage.includes('bug') ||
    lowerMessage.includes('error') ||
    lowerMessage.includes('programming') ||
    message.includes('```')
  ) {
    return {
      model: 'gpt4',
      reason: 'GPT-4 excels at code generation, debugging, and technical problem-solving.',
    };
  }

  // Real-time / search queries
  if (
    lowerMessage.includes('latest') ||
    lowerMessage.includes('news') ||
    lowerMessage.includes('today') ||
    lowerMessage.includes('current') ||
    lowerMessage.includes('search') ||
    lowerMessage.includes('find')
  ) {
    return {
      model: 'perplexity',
      reason: 'Perplexity provides real-time search and up-to-date information.',
    };
  }

  // Research / factual queries
  if (
    lowerMessage.includes('research') ||
    lowerMessage.includes('study') ||
    lowerMessage.includes('fact') ||
    lowerMessage.includes('statistics') ||
    lowerMessage.includes('data') ||
    lowerMessage.includes('compare')
  ) {
    return {
      model: 'gemini',
      reason: 'Gemini Pro excels at research and providing factual, well-sourced information.',
    };
  }

  // Default to Claude for general writing and analysis
  return {
    model: 'claude',
    reason: 'Claude is ideal for thoughtful analysis, creative writing, and nuanced discussions.',
  };
}

// Mock response generation (in production, this would call actual AI APIs)
function generateResponse(message: string, model: Model): string {
  const responses: Record<Model, string> = {
    claude: `Thank you for your question. Let me provide a thoughtful analysis.

Based on your query about "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}", here are my insights:

**Key Points:**
1. This is an interesting topic that warrants careful consideration
2. There are multiple perspectives to consider
3. The most effective approach depends on your specific context

Would you like me to elaborate on any of these points?`,

    gpt4: `I'll help you with that. Here's my technical analysis:

\`\`\`typescript
// Example implementation
function analyze(input: string): Result {
  // Process the input
  const processed = preprocess(input);

  // Apply logic
  return computeResult(processed);
}
\`\`\`

The key concepts here are:
- **Processing**: Handle input data efficiently
- **Logic**: Apply appropriate algorithms
- **Output**: Return structured results

Let me know if you need more specific guidance!`,

    gemini: `Based on my research, here's what I found:

**Research Summary:**

Your question touches on several important areas. Here's a comprehensive overview:

📊 **Key Statistics:**
- Data point 1: Relevant finding
- Data point 2: Supporting evidence
- Data point 3: Contextual information

📚 **Sources:**
- Academic research supports these findings
- Industry reports confirm the trends
- Expert opinions align with this analysis

Would you like me to dive deeper into any specific aspect?`,

    perplexity: `🔍 **Real-Time Search Results:**

I searched for the latest information on your query. Here's what I found:

**Top Results:**

1. **Recent Development** - Updated information shows...
2. **Trending Topic** - Current discussions highlight...
3. **Expert Opinion** - Industry leaders suggest...

**Key Takeaways:**
- The landscape is evolving rapidly
- Multiple factors influence the outcome
- Staying informed is crucial

*Sources: Based on real-time web search*

Would you like me to search for more specific information?`,
  };

  return responses[model];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, model: preferredModel } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Route to appropriate model
    const { model, reason } = routeToModel(message, preferredModel);

    // Simulate API delay (in production, this would be actual API call time)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

    // Generate response
    const content = generateResponse(message, model);

    const response: ChatResponse = {
      id: `msg-${Date.now()}`,
      model,
      routingReason: reason,
      content,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
