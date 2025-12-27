'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'ghost';
  autoResize?: boolean;
  maxHeight?: number;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      variant = 'default',
      autoResize = true,
      maxHeight = 200,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
        textareaRef.current.style.height = `${newHeight}px`;
      }
      onChange?.(e);
    };

    const setRef = (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const variantClasses = {
      default:
        'bg-background-tertiary border border-border focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/10',
      ghost:
        'bg-transparent border-none',
    };

    return (
      <textarea
        ref={setRef}
        className={cn(
          'w-full resize-none rounded-lg px-3 py-2 text-sm',
          'text-text-primary placeholder:text-text-tertiary',
          'transition-all duration-200 focus:outline-none',
          'font-inherit leading-relaxed',
          variantClasses[variant],
          className
        )}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

TextArea.displayName = 'TextArea';

export { TextArea };
