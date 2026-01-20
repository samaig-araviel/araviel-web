'use client';

import { getGreeting } from '@/lib/utils';

interface WelcomeHeroProps {
  userName: string;
}

export function WelcomeHero({ userName }: WelcomeHeroProps) {
  const greeting = getGreeting();

  return (
    <div className="animate-fade-in text-center">
      <h1 className="mb-2 text-2xl font-semibold text-text-primary md:text-3xl">
        {greeting}, {userName}
      </h1>
      <p className="text-base text-text-secondary md:text-lg">
        What would you like to work through today?
      </p>
    </div>
  );
}
