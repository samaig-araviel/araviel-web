import { AnthropicLogo, OpenAILogo, GoogleLogo, PerplexityLogo, XAILogo, ElevenLabsLogo } from './ProviderLogos';

/**
 * Get the logo component for a given provider ID.
 */
export function getProviderLogo(providerId) {
  const logos = {
    anthropic: AnthropicLogo,
    openai: OpenAILogo,
    google: GoogleLogo,
    perplexity: PerplexityLogo,
    xai: XAILogo,
    elevenlabs: ElevenLabsLogo,
  };
  return logos[providerId] || AnthropicLogo;
}
