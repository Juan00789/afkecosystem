
'use client';
import Link from 'next/link';
import {
  Home,
  Briefcase,
  Settings,
  ShoppingBag,
  BookOpen,
  HandCoins,
  HandHelping,
  GraduationCap,
  Landmark,
  FileSearch,
  Banknote,
  MessageSquareHeart,
  Archive,
  BarChart,
  GitFork,
  FileText,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { Separator } from './ui/separator';

export function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const navLinks = [
    { section: 'Principal', href: '/dashboard', label: 'Panel Principal', icon: Home },
    { section: 'Principal', href: '/dashboard/cases', label: 'Mis Casos', icon: Briefcase },
    { section: 'Colabora', href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { section: 'Colabora', href: '/dashboard/network', label: 'Mis Brokis', icon: GitFork },
    { section: 'Colabora', href: '/dashboard/mentorias', label: 'Mentorías', icon: MessageSquareHeart },
    { section: 'Gestiona', href: '/dashboard/contabilidad', label: 'Mis Finanzas', icon: Landmark },
    { section: 'Gestiona', href: '/dashboard/cotizador', label: 'Cotizador', icon: FileText },
    { section: 'Gestiona', href: '/dashboard/productos', label: 'Mi Almacén', icon: Archive },
    { section: 'Gestiona', href: '/dashboard/services', label: 'Mis Servicios', icon: Briefcase },
    { section: 'Gestiona', href: '/dashboard/my-courses', label: 'Mis Cursos', icon: GraduationCap },
    { section: 'Crece', href: '/dashboard/cursos', label: 'Cursos', icon: BookOpen },
    { section: 'Crece', href: '/dashboard/creditos', label: 'Créditos', icon: HandCoins },
    { section: 'Crece', href: '/dashboard/analisis', label: 'Análisis IA', icon: FileSearch },
    ...(userProfile?.role === 'admin' ? [{ section: 'Admin', href: '/dashboard/fondo', label: 'Fondo Ecosistema', icon: Banknote }] : []),
  ];
  
  const bottomLinks = [
    { section: 'Cuenta', href: '/dashboard/profile', label: 'Mi Perfil', icon: Settings },
  ];

  const renderLink = (link: { href: string; label: string; icon: any }) => {
    const { href, label, icon: Icon } = link;
    const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href);

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
  
   const groupedLinks = navLinks.reduce((acc, link) => {
    if (!acc[link.section]) {
      acc[link.section] = [];
    }
    acc[link.section].push(link);
    return acc;
  }, {} as Record<string, typeof navLinks>);


  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <HandHelping className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">AFKEcosystem</span>
          </Link>
          {Object.entries(groupedLinks).map(([section, links], index) => (
              <div key={section} className="flex flex-col items-center gap-4 w-full">
                {index > 0 && <Separator className="my-2" />}
                {links.map(renderLink)}
              </div>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          {bottomLinks.map(renderLink)}
        </nav>
      </TooltipProvider>
    </aside>
  );
}
