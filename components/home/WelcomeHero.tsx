'use client';

import { getGreeting } from '@/lib/utils';

interface WelcomeHeroProps {
  userName: string;
}

export function WelcomeHero({ userName }: WelcomeHeroProps) {
  const greeting = getGreeting();

  return (
    <div className="animate-fade-in text-center">
      <h1 className="mb-3 text-3xl font-semibold text-text-primary md:text-4xl">
        {greeting}, {userName} 👋
      </h1>
      <p className="text-lg text-text-secondary">
        What would you like to explore today?
      </p>
    </div>
  );
}
