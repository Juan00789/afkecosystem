'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { Home, Users, Briefcase, FileText, Settings, CreditCard, Bell, Receipt, Search, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from 'next/navigation';
import { RoleSwitcher } from '@/components/role-switcher';
import Link from 'next/link';

const providerLinks = [
    { href: "/dashboard", icon: <Home />, label: "Dashboard", tooltip: "Dashboard" },
    { href: "/dashboard/clients", icon: <Users />, label: "Clientes", tooltip: "Clientes" },
    { href: "/dashboard/cases", icon: <Briefcase />, label: "Casos", tooltip: "Casos" },
    { href: "/dashboard/quotes", icon: <FileText />, label: "Cotizaciones", tooltip: "Cotizaciones" },
    { href: "/dashboard/services", icon: <ListTodo />, label: "Servicios", tooltip: "Servicios" },
    { href: "/dashboard/invoices", icon: <Receipt />, label: "Facturas", tooltip: "Facturas" },
    { href: "/dashboard/billing", icon: <CreditCard />, label: "Contabilidad", tooltip: "Contabilidad" },
];

const clientLinks = [
    { href: "/dashboard", icon: <Home />, label: "Inicio", tooltip: "Inicio" },
    { href: "/dashboard/explore", icon: <Search />, label: "Explorar", tooltip: "Explorar Servicios" },
    { href: "/dashboard/cases", icon: <Briefcase />, label: "Mis Casos", tooltip: "Mis Casos" },
    { href: "/dashboard/invoices", icon: <Receipt />, label: "Mis Facturas", tooltip: "Mis Facturas" },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('¡Hola!');
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState('provider');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const name = userData.name || currentUser.displayName;
          setUserName(name ? `¡Hola, ${name.split(' ')[0]}!` : '¡Hola!');
          setActiveRole(userData.activeRole || 'provider');
        } else {
           const name = currentUser.displayName;
           setUserName(name ? `¡Hola, ${name.split(' ')[0]}!` : '¡Hola!');
           await setDoc(docRef, { 
             name: currentUser.displayName, 
             email: currentUser.email,
             activeRole: 'provider',
             roles: ['provider', 'client']
            }, { merge: true });
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
     return () => unsubscribe();
  }, [router]);
  
  const handleRoleChange = async (newRole: string) => {
    if (user) {
        setActiveRole(newRole);
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { activeRole: newRole }, { merge: true });
        router.push('/dashboard');
        router.refresh();
    }
  };

  const navLinks = useMemo(() => {
      return activeRole === 'provider' ? providerLinks : clientLinks;
  }, [activeRole]);


  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Cargando...</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="p-4">
          <div className="group-data-[collapsible=icon]:hidden">
            <Logo />
          </div>
          <div className="hidden group-data-[collapsible=icon]:block">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-primary"
                >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navLinks.map((link) => (
               <SidebarMenuItem key={link.href}>
                 <Link href={link.href} legacyBehavior passHref>
                    <SidebarMenuButton as="a" isActive={pathname === link.href} tooltip={link.tooltip}>
                        {link.icon}
                        {link.label}
                    </SidebarMenuButton>
                 </Link>
               </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard/profile" legacyBehavior passHref>
                <SidebarMenuButton as="a" isActive={pathname === '/dashboard/profile'} tooltip="Configuración">
                  <Settings />
                  Configuración
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4 lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold md:text-xl">{userName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <RoleSwitcher 
                currentRole={activeRole} 
                onRoleChange={handleRoleChange} 
             />
            <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Toggle notifications</span>
            </Button>
            <UserNav />
          </div>
        </header>
        <main className="flex-1">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
