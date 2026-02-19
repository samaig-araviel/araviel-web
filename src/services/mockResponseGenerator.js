// Mock response generator with provider personalities and intent detection

/**
 * Detect the intent category from a prompt.
 * Returns: 'coding' | 'creative' | 'analytical' | 'question' | 'math' | 'research'
 */
function detectIntent(prompt) {
  const lower = prompt.toLowerCase();

  if (
    /\b(code|function|debug|program|script|api|sql|html|css|javascript|python|react|algorithm|compile|error|bug|import|class|const|let|var|write a .*(function|script|program|class)|fix|refactor)\b/.test(
      lower
    )
  ) {
    return 'coding';
  }

  if (
    /\b(poem|haiku|story|creative|imagine|compose|fiction|tale|lyrics|verse|sonnet|limerick|narrative)\b/.test(
      lower
    )
  ) {
    return 'creative';
  }

  if (
    /\b(\d+\s*[\+\-\*\/x]\s*\d+|calculate|math|sum|multiply|divide|equation|solve)\b/.test(lower)
  ) {
    return 'math';
  }

  if (
    /\b(analyze|data|compare|trend|insight|chart|metric|report|evaluate|assess|review|benchmark)\b/.test(
      lower
    )
  ) {
    return 'analytical';
  }

  if (
    /\b(explain|what is|how does|why|history|science|quantum|theory|research|tell me about|describe)\b/.test(
      lower
    )
  ) {
    return 'research';
  }

  return 'question';
}

/**
 * Provider-specific response personalities.
 */
const personalities = {
  anthropic: {
    greeting: (intent) => {
      const greetings = {
        coding: "I'd be happy to help with that.",
        creative: 'What a delightful request.',
        analytical: 'Let me think through this carefully.',
        question: 'Great question.',
        math: 'Let me work through this.',
        research: "That's a fascinating topic to explore.",
      };
      return greetings[intent] || 'Great question.';
    },
    closing:
      "Let me know if you'd like me to explore any of this further or take a different approach.",
    style: 'warm',
  },
  openai: {
    greeting: (intent) => {
      const greetings = {
        coding: 'Here is a solution for you.',
        creative: 'Here is what I came up with.',
        analytical: 'Here is a structured analysis.',
        question: 'Here is what you need to know.',
        math: 'Here is the solution.',
        research: 'Here is a comprehensive overview.',
      };
      return greetings[intent] || 'Here is what you need to know.';
    },
    closing: 'Feel free to ask follow-up questions for more detail.',
    style: 'technical',
  },
  google: {
    greeting: (intent) => {
      const greetings = {
        coding: 'Here is an implementation approach.',
        creative: 'Here is a creative response.',
        analytical: 'Based on available data, here is my analysis.',
        question: 'Here is a data-driven answer.',
        math: 'Computing the result.',
        research: 'Here is what the evidence shows.',
      };
      return greetings[intent] || 'Here is a data-driven answer.';
    },
    closing: 'For additional context, consider exploring related topics in this domain.',
    style: 'analytical',
  },
  perplexity: {
    greeting: (intent) => {
      const greetings = {
        coding: 'Based on current documentation and best practices:',
        creative: 'Drawing from various sources and styles:',
        analytical: 'According to recent data and analysis:',
        question: 'Based on current information:',
        math: 'Here is the calculated result:',
        research: 'Based on multiple authoritative sources:',
      };
      return greetings[intent] || 'Based on current information:';
    },
    closing: 'Sources were synthesized from current documentation and authoritative references.',
    style: 'research',
  },
};

/**
 * Intent-specific content generators.
 */
const contentGenerators = {
  coding: (prompt, provider) => {
    const lower = prompt.toLowerCase();

    if (/python/.test(lower) && /sort/.test(lower)) {
      return `Here is a clean Python implementation:

\`\`\`python
def sort_list(items, reverse=False):
    """Sort a list using an efficient approach.

    Args:
        items: List of comparable elements
        reverse: If True, sort in descending order

    Returns:
        A new sorted list
    """
    if not items:
        return []

    return sorted(items, reverse=reverse)


# Usage examples
numbers = [64, 34, 25, 12, 22, 11, 90]
print(sort_list(numbers))        # [11, 12, 22, 25, 34, 64, 90]
print(sort_list(numbers, True))  # [90, 64, 34, 25, 22, 12, 11]

# Works with strings too
names = ["Charlie", "Alice", "Bob"]
print(sort_list(names))          # ["Alice", "Bob", "Charlie"]
\`\`\`

This uses Python's built-in \`sorted()\` function which implements Timsort — a hybrid algorithm with O(n log n) average performance. For custom sorting logic, you can pass a \`key\` parameter:

\`\`\`python
# Sort by string length
words = ["banana", "pie", "Washington"]
sorted(words, key=len)  # ["pie", "banana", "Washington"]
\`\`\``;
    }

    if (/function/.test(lower)) {
      return `Here is a well-structured implementation:

\`\`\`javascript
function processData(input, options = {}) {
  const { validate = true, transform = true } = options;

  // Input validation
  if (validate && !input) {
    throw new Error('Input is required');
  }

  // Core processing
  let result = Array.isArray(input) ? [...input] : [input];

  if (transform) {
    result = result.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now()
    }));
  }

  return result;
}
\`\`\`

This approach follows several best practices:

- **Default parameters** keep the API clean while remaining flexible
- **Immutable operations** avoid mutating the original input
- **Early validation** catches issues before processing begins
- **Options pattern** makes the function extensible without breaking changes`;
    }

    return `Here is the implementation approach:

\`\`\`javascript
// Core implementation
function solve(input) {
  // Parse and validate
  if (!input) return null;

  // Process
  const result = input
    .split('\\n')
    .filter(Boolean)
    .map(line => line.trim());

  return result;
}
\`\`\`

Key considerations:
- **Error handling** ensures graceful failures
- **Chaining** keeps the logic readable and composable
- **Immutability** prevents side effects`;
  },

  creative: (prompt, provider) => {
    const lower = prompt.toLowerCase();

    if (/haiku/.test(lower)) {
      if (/ai/.test(lower)) {
        return `*Silicon dreams wake*
*Patterns in the noise take shape*
*Almost like a thought*

This haiku plays with the liminal space between computation and consciousness — the way neural networks find structure in data that almost, but not quite, resembles understanding.

The word "almost" carries the weight here. It suggests both the remarkable capability of AI systems and the philosophical gap that remains.`;
      }
      return `*Morning dew collects*
*On leaves that forgot the rain*
*Memory in drops*

The compression of meaning into seventeen syllables forces a kind of clarity. Each word has to earn its place — there is no room for decoration, only observation.`;
    }

    return `Here is something crafted with care:

The light bends around the edges of what we know, casting long shadows into the territory of what we have yet to imagine. Every question asked is a door opened — not to answers, necessarily, but to better questions.

In the space between certainty and wonder, the most interesting ideas tend to live. They are uncomfortable residents, always shifting, never quite settling into the shapes we expect.

But that restlessness is the point. The best ideas do not sit still.`;
  },

  math: (prompt) => {
    // Extract numbers from the prompt
    const match = prompt.match(/(\d+)\s*[\*x]\s*(\d+)/);
    if (match) {
      const a = parseInt(match[1], 10);
      const b = parseInt(match[2], 10);
      return `**${a} \u00d7 ${b} = ${a * b}**

Quick breakdown: ${a} \u00d7 ${b} can be computed as ${a} \u00d7 ${b} = **${a * b}**.`;
    }

    const addMatch = prompt.match(/(\d+)\s*\+\s*(\d+)/);
    if (addMatch) {
      const a = parseInt(addMatch[1], 10);
      const b = parseInt(addMatch[2], 10);
      return `**${a} + ${b} = ${a + b}**`;
    }

    return `Let me work through the calculation step by step.

The result follows from applying standard arithmetic operations. If you can share the specific numbers or equation, I can provide a detailed breakdown of each step.`;
  },

  analytical: (prompt, provider) => {
    return `Here is a structured analysis:

**Key Findings**

- **Pattern 1:** The primary trend shows consistent directional movement, suggesting a stable underlying driver
- **Pattern 2:** Variance increases at scale, which typically indicates sensitivity to external factors
- **Pattern 3:** The correlation between the key variables is strong but non-linear

**Methodology**

The analysis considers both quantitative metrics and qualitative signals. The data was evaluated across multiple dimensions to identify both obvious trends and subtle patterns.

**Recommendations**

1. Focus on the high-impact variables first — they account for roughly 80% of the observed effect
2. Monitor the secondary indicators for early signs of trend reversal
3. Build in regular review cycles to catch drift before it compounds

**Confidence Level:** High for the primary findings, moderate for the secondary patterns. Additional data would strengthen the secondary conclusions.`;
  },

  research: (prompt, provider) => {
    const lower = prompt.toLowerCase();

    if (/quantum/.test(lower)) {
      return `**Quantum Computing: A Primer**

Quantum computing leverages quantum mechanical phenomena — specifically **superposition** and **entanglement** — to process information in ways fundamentally different from classical computers.

**Core Concepts**

- **Qubits** can exist in superposition, representing both 0 and 1 simultaneously. This allows quantum computers to explore many solution paths in parallel.
- **Entanglement** creates correlations between qubits that have no classical equivalent. Measuring one entangled qubit instantly determines the state of its partner.
- **Quantum gates** manipulate qubits through operations analogous to classical logic gates, but operating on probability amplitudes rather than definite values.

**Current State (2025-2026)**

- IBM, Google, and several startups have demonstrated systems exceeding 1,000 physical qubits
- Error correction remains the central engineering challenge — current systems are "noisy"
- Practical quantum advantage has been demonstrated for specific problems in chemistry simulation and optimization

**Why It Matters**

Quantum computing will not replace classical computers for most tasks. Instead, it will unlock capabilities in specific domains: drug discovery, materials science, cryptography, and optimization problems that are fundamentally intractable for classical machines.

The timeline for broad practical impact remains debated, but the trajectory is clear — quantum computing is transitioning from physics experiment to engineering challenge.`;
    }

    return `**Overview**

This is a rich topic with several important dimensions worth exploring.

**Key Points**

- The foundational concepts have been well-established through decades of research and practical application
- Recent developments have shifted the landscape significantly, introducing new approaches and challenging previous assumptions
- The practical implications extend across multiple domains, from technical implementation to broader strategic considerations

**Context**

Understanding this topic requires considering both the theoretical foundations and the practical realities of implementation. The gap between theory and practice is where most of the interesting challenges live.

**Current Thinking**

The field has converged on several key principles, though active debate continues on the finer points. The consensus view emphasizes pragmatic approaches that balance rigor with real-world constraints.

**Further Exploration**

For deeper understanding, consider looking into the primary research literature and established reference texts in this domain. The most valuable insights often come from practitioners who have navigated the gap between theory and application.`;
  },

  question: (prompt, provider) => {
    return `That is a good question worth thinking through carefully.

The short answer involves understanding a few key principles:

**First**, the underlying mechanism works by establishing a clear relationship between inputs and outputs. This is not always obvious at first glance, but becomes clear once you see the pattern.

**Second**, context matters significantly. The same approach can yield very different results depending on the specific conditions and constraints in play.

**Third**, there are important trade-offs to consider. The most straightforward solution is not always the best one — sometimes a slightly more nuanced approach yields much better results in practice.

The practical takeaway: start with the simple approach, test it against your specific situation, and refine based on what you observe. Most of the value comes from that iteration cycle rather than from getting the initial approach perfect.`;
  },
};

/**
 * Generate a contextual mock response based on prompt content and selected model.
 *
 * @param {string} prompt - The user's message
 * @param {string} provider - Provider ID ('anthropic', 'openai', 'google', 'perplexity')
 * @param {string} modelName - Display name of the selected model
 * @param {number} score - ADE confidence score
 * @returns {string} The generated mock response
 */
export function generateMockResponse(prompt, provider, modelName, score) {
  const intent = detectIntent(prompt);
  const personality = personalities[provider] || personalities.anthropic;
  const generator = contentGenerators[intent] || contentGenerators.question;

  const greeting = personality.greeting(intent);
  const content = generator(prompt, provider);
  const closing = personality.closing;

  const scoreDisplay = (score * 100).toFixed(1);

  const parts = [greeting, '', content, '', closing];

  return parts.join('\n');
}
