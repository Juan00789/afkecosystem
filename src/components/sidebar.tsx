// src/components/sidebar.tsx
'use client';
import Link from 'next/link';
import {
  Home,
  Users,
  Briefcase,
  FileText,
  Settings,
  ShoppingBag,
  BookOpen,
  HandCoins,
  Rocket,
  MessageSquareText,
  Sparkles,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/dashboard/cursos', label: 'Cursos', icon: BookOpen },
  { href: '/dashboard/creditos', label: 'Créditos', icon: HandCoins },
  { href: '/dashboard/consultorias', label: 'Consultorías', icon: MessageSquareText },
  { href: '/dashboard/network', label: 'Brokis', icon: Users },
  { href: '/dashboard/quotes', label: 'Quotes', icon: Sparkles },
];

const bottomLinks = [
  { href: '/dashboard/profile', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const renderLink = (link: { href: string; label: string; icon: any }) => {
    const { href, label, icon: Icon } = link;
    const isActive = pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard');


    return (
      <Tooltip key={label}>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Rocket className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">AFKEcosystem</span>
          </Link>
          {navLinks.map(renderLink)}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          {bottomLinks.map(renderLink)}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
