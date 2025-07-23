
// src/components/header.tsx
'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Menu,
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
  GitFork,
  History,
  BarChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { Role } from '@/modules/auth/types';
import { Separator } from './ui/separator';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const { user, userProfile, signOutUser } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    // Redirect handled by AuthProvider/useAuth hook
  };

  const navSections = {
    'Principal': [
      { href: '/dashboard', label: 'Panel Principal', icon: Home },
    ],
    'Colabora': [
      { href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { href: '/dashboard/network', label: 'Mis Brokis', icon: GitFork },
      { href: '/dashboard/mentorias', label: 'Mentorías', icon: MessageSquareHeart },
    ],
    'Gestiona': [
      { href: '/dashboard/contabilidad', label: 'Mis Finanzas', icon: Landmark },
      { href: '/dashboard/contabilidad/historial', label: 'Historial Financiero', icon: History },
      { href: '/dashboard/contabilidad/invoices', label: 'Documentos', icon: FileText },
      { href: '/dashboard/analisis/financiero', label: 'Análisis Financiero', icon: BarChart },
      { href: '/dashboard/cotizador', label: 'Cotizador', icon: FileText },
      { href: '/dashboard/productos', label: 'Mi Almacén', icon: Archive },
      { href: '/dashboard/services', label: 'Mis Servicios', icon: Briefcase },
      { href: '/dashboard/my-courses', label: 'Mis Cursos', icon: GraduationCap },
    ],
    'Crece': [
      { href: '/dashboard/cursos', label: 'Cursos', icon: BookOpen },
      { href: '/dashboard/creditos', label: 'Créditos', icon: HandCoins },
      { href: '/dashboard/analisis', label: 'Análisis IA', icon: FileSearch },
    ],
    ...(userProfile?.role === 'admin' ? {
      'Admin': [
        { href: '/dashboard/fondo', label: 'Fondo Ecosistema', icon: Banknote }
      ]
    } : {})
  };

  const bottomLinks = [
    { href: '/dashboard/profile', label: 'Mi Perfil', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs flex flex-col">
          <nav className="flex flex-col gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <HandHelping className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">AFKEcosystem</span>
            </Link>
            
            {Object.entries(navSections).map(([section, links]) => (
                <div key={section}>
                    <p className="px-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section}</p>
                    {links.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={label}
                        href={href}
                        className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </Link>
                    ))}
                </div>
            ))}
          </nav>
          <nav className="mt-auto flex flex-col gap-6 text-lg font-medium">
            <Separator />
            {bottomLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Placeholder for potential search bar */}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User avatar"
                  className="h-full w-full object-cover"
                  data-ai-hint="person"
                />
              ) : (
                <span className="font-semibold">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">Mi Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="https://wa.me/18299226556" target="_blank" rel="noopener noreferrer">Soporte</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
