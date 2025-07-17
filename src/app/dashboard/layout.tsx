'use client';
import { useEffect, useState } from 'react';
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
import { Home, Users, Briefcase, FileText, Settings, CreditCard, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

async function marcarPresentacionActiva(userId: string) {
  try {
    await setDoc(doc(db, "usuarios", userId), {
      loginTimestamp: new Date(),
      presentacion: "uno", // 🌟 Aquí lo declaras
      estado: "activo",
    }, { merge: true });
    console.log("Presentación activa marcada para el usuario:", userId);
  } catch (error) {
    console.error("Error al marcar presentación activa:", error);
  }
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('¡Hola!');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Usamos un ID de usuario estático para la demostración.
        // Esto se reemplazará con el ID del usuario autenticado.
        const userId = 'agente_juan_perez';
        marcarPresentacionActiva(userId);
        
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          // Prioritize name from Firestore, fallback to display name, then generic greeting
          setUserName(userData.name ? `¡Hola, ${userData.name.split(' ')[0]}!` : (currentUser.displayName ? `¡Hola, ${currentUser.displayName}!` : '¡Hola!'));
        } else {
           setUserName(currentUser.displayName ? `¡Hola, ${currentUser.displayName}!` : '¡Hola!');
        }
      } else {
        // En un caso real, podrías redirigir al login
        // router.push('/login');
      }
    });
     return () => unsubscribe();
  }, []);

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
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard" tooltip="Dashboard">
                <Home />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" tooltip="Clientes">
                <Users />
                Clientes
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" tooltip="Casos">
                <Briefcase />
                Casos
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard/quotes" tooltip="Cotizaciones">
                <FileText />
                Cotizaciones
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="/dashboard/billing" tooltip="Facturación">
                <CreditCard />
                Facturación
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" tooltip="Configuración">
                <Settings />
                Configuración
              </SidebarMenuButton>
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
          <div className="flex items-center gap-2">
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
