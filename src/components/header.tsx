// src/components/header.tsx
'use client';

import Link from 'next/link';
import {
  Bell,
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
  TrendingUp,
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

interface HeaderProps {
}

export function Header({}: HeaderProps) {
  const { user, userProfile, signOutUser } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    // Redirect handled by AuthProvider/useAuth hook
  };

  const navLinks = [
    { href: '/dashboard', label: 'Panel Principal', icon: Home },
    { href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { href: '/dashboard/cursos', label: 'Cursos', icon: BookOpen },
    { href: '/dashboard/my-courses', label: 'Mis Cursos', icon: GraduationCap },
    { href: '/dashboard/creditos', label: 'Créditos', icon: HandCoins },
    { href: '/dashboard/consultorias', label: 'Mentorías', icon: MessageSquareHeart },
    { href: '/dashboard/inversiones', label: 'Inversiones', icon: TrendingUp },
    { href: '/dashboard/analisis', label: 'Análisis IA', icon: FileSearch },
    { href: '/dashboard/network', label: 'Mis Brokis', icon: Users },
    { href: '/dashboard/services', label: 'Mis Servicios', icon: Briefcase },
    { href: '/dashboard/contabilidad', label: 'Mis Finanzas', icon: Landmark },
    ...(userProfile?.role === 'admin' ? [{ href: '/dashboard/fondo', label: 'Fondo Ecosistema', icon: Banknote }] : []),
  ];
  
  const bottomLinks = [
      { href: '/dashboard/profile', label: 'Mi Perfil', icon: Settings },
  ]

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
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <HandHelping className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">AFKEcosystem</span>
            </Link>
            {navLinks.map(({ href, label, icon: Icon }) => (
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
           <nav className="mt-auto grid gap-6 text-lg font-medium">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Nuevo caso asignado</DropdownMenuItem>
            <DropdownMenuItem>Créditos acreditados</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ver todas</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
