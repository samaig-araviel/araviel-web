'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, MessageSquare, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  onNewChat?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  href?: string;
  isAction?: boolean;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'chats', label: 'Chats', icon: MessageSquare, href: '/chats' },
  { id: 'new', label: 'New', icon: Plus, isAction: true },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function MobileNav({ onNewChat }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNewChat = () => {
    onNewChat?.();
    // Navigate to the new chat will be handled by the parent component
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background-secondary md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = !item.isAction && pathname === item.href;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={handleNewChat}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href || '/'}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-text-muted transition-colors',
                isActive && 'text-accent'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background-secondary" />
    </nav>
  );
}
