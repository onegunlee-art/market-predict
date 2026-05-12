'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@market-predict/ui';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  Shield,
  BarChart3,
  Brain,
  Layers,
  Settings,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Users', icon: Users, href: '/users' },
  { label: 'Markets', icon: TrendingUp, href: '/markets' },
  { label: 'Content', icon: FileText, href: '/content' },
  { label: 'Moderation', icon: Shield, href: '/moderation' },
  { label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { label: 'AI Engine', icon: Brain, href: '/ai' },
  { label: 'CMS', icon: Layers, href: '/cms' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <TrendingUp className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
