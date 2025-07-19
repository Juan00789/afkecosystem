
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
import { Home, Briefcase, FileText, Settings, CreditCard, Bell, Receipt, Search, ListTodo, BrainCircuit, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, db } from "@/lib/firebase";
import { useRouter, usePathname } from 'next/navigation';
import { RoleSwitcher } from '@/components/role-switcher';
import Link from 'next/link';

const navLinks = [
    { href: "/dashboard", icon: <Home />, label: "Dashboard", tooltip: "Dashboard" },
    { href: "/dashboard/network", icon: <Network />, label: "Red", tooltip: "Red" },
    { href: "/dashboard/cases", icon: <Briefcase />, label: "Casos", tooltip: "Casos" },
    { href: "/dashboard/quotes", icon: <FileText />, label: "Cotizaciones", tooltip: "Cotizaciones" },
    { href: "/dashboard/services", icon: <ListTodo />, label: "Mis Servicios", tooltip: "Mis Servicios" },
    { href: "/dashboard/explore", icon: <Search />, label: "Explorar", tooltip: "Explorar" },
    { href: "/dashboard/invoices", icon: <Receipt />, label: "Facturas", tooltip: "Facturas" },
    { href: "/dashboard/billing", icon: <CreditCard />, label: "Contabilidad", tooltip: "Contabilidad" },
    { href: "/dashboard/hidden-game", icon: <BrainCircuit />, label: "Juego Oculto", tooltip: "Juego Oculto" },
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
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);

        let userData;
        if (docSnap.exists()) {
          userData = docSnap.data();
        } else {
           // This case is for social auth users who might not have a doc yet.
           const name = currentUser.displayName;
           userData = { 
             name: name, 
             email: currentUser.email,
             activeRole: 'provider',
             roles: ['provider', 'client']
           };
           await setDoc(userRef, userData, { merge: true });
        }
        
        const name = userData.name || currentUser.displayName;
        setUserName(name ? `¡Hola, ${name.split(' ')[0]}!` : '¡Hola!');
        setActiveRole(userData.activeRole || 'provider');

        // Magic Link logic moved here
        if (userData.phoneNumber) {
            await linkPreRegisteredClient(currentUser, userData.phoneNumber);
        }

      } else {
        router.push('/login');
      }
      setLoading(false);
    });
     return () => unsubscribe();
  }, [router]);
  
  const linkPreRegisteredClient = async (user: User, phoneNumber: string) => {
      // Find a client pre-registered with this phone number that hasn't been linked yet
      const clientsQuery = query(
          collection(db, 'clients'), 
          where('phone', '==', phoneNumber),
          where('userId', '==', null)
      );
      const querySnapshot = await getDocs(clientsQuery);

      if (!querySnapshot.empty) {
          const batch = writeBatch(db);
          const clientDoc = querySnapshot.docs[0]; // Link the first one found
          const clientData = clientDoc.data();
          const userRef = doc(db, 'users', user.uid);

          // 1. Update the client doc with the new user's UID
          batch.update(clientDoc.ref, { userId: user.uid });

          // 2. Add the provider to the new user's network
          if (clientData.providerId) {
              const providerSubCollectionRef = doc(collection(db, 'users', user.uid, 'providers'));
              batch.set(providerSubCollectionRef, {
                  providerId: clientData.providerId,
                  status: 'main', // Make them the main provider automatically
                  createdAt: serverTimestamp()
              });
              // 3. Update the user's role to client, since they were invited
              batch.update(userRef, { activeRole: 'client' });
          }
          
          await batch.commit();
          // Force a reload to reflect the new role and data
          window.location.reload(); 
      }
  };


  const handleRoleChange = async (newRole: string) => {
    if (user) {
        setActiveRole(newRole);
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { activeRole: newRole }, { merge: true });
        window.location.href = '/dashboard';
    }
  };

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
                 <Link href={link.href} passHref>
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
              <Link href="/dashboard/profile" passHref>
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
