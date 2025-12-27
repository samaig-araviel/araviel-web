'use client';

import * as React from 'react';
import { Sparkles, MessageCircle, Lightbulb, Code, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { sendMessage } from '@/store/slices/chatSlice';

interface SuggestionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
  gradient: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  icon,
  title,
  description,
  prompt,
  gradient,
}) => {
  const dispatch = useAppDispatch();

  const handleClick = () => {
    dispatch(
      sendMessage({
        content: prompt,
        model: 'Auto',
      })
    );
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex flex-col items-start gap-3 p-4 rounded-xl',
        'bg-background-secondary border border-border',
        'text-left transition-all duration-300',
        'hover:border-accent-primary/30 hover:shadow-lg hover:shadow-accent-primary/5',
        'hover:-translate-y-0.5',
        'group'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          'bg-gradient-to-br',
          gradient,
          'transition-transform group-hover:scale-110'
        )}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-xs text-text-tertiary line-clamp-2">{description}</p>
      </div>
    </button>
  );
};

const WelcomeScreen: React.FC = () => {
  const suggestions: SuggestionCardProps[] = [
    {
      icon: <MessageCircle size={18} className="text-white" />,
      title: 'Start a conversation',
      description: 'Ask me anything and I\'ll help you find answers',
      prompt: 'Hello! What can you help me with today?',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Lightbulb size={18} className="text-white" />,
      title: 'Brainstorm ideas',
      description: 'Get creative suggestions for your projects',
      prompt: 'Help me brainstorm some creative ideas for a new project',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: <Code size={18} className="text-white" />,
      title: 'Write code',
      description: 'Get help with programming and debugging',
      prompt: 'Help me write a function that validates email addresses',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: <FileText size={18} className="text-white" />,
      title: 'Analyze documents',
      description: 'Upload files and get insights from your content',
      prompt: 'I\'d like to analyze a document. How should I proceed?',
      gradient: 'from-purple-500 to-violet-500',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center max-w-2xl mb-10">
        {/* Logo */}
        <div
          className={cn(
            'w-20 h-20 mx-auto mb-6 rounded-2xl',
            'bg-gradient-to-br from-accent-primary/20 to-accent-hover/10',
            'flex items-center justify-center',
            'animate-pulseGlow'
          )}
        >
          <Sparkles size={32} className="text-accent-primary" />
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
          Welcome to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-hover">
            Araviel
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          Your AI assistant powered by multiple models. Choose the best AI for your
          task or let Auto mode decide.
        </p>
      </div>

      {/* Suggestion Cards */}
      <div className="w-full max-w-2xl">
        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-4 text-center">
          Try one of these
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard key={index} {...suggestion} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-text-tertiary mt-10 text-center max-w-md">
        Araviel can make mistakes. Consider verifying important information.
      </p>
    </div>
  );
};

export { WelcomeScreen };
