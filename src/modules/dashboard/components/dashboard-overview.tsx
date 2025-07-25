// src/modules/dashboard/components/dashboard-overview.tsx
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Case, UserProfile } from '@/modules/cases/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CaseCard } from '@/modules/cases/components/case-card';
import Link from 'next/link';
import {
  PlusCircle,
  ShoppingBag,
  BookOpen,
  HandCoins,
  MessageSquareHeart,
  Briefcase,
  Sparkles,
  Award,
  BarChart,
  LineChart,
  Landmark,
  FileSearch,
  Archive,
  GitFork,
  GraduationCap,
  FileText
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, Legend, BarChart as ReBarChart, LineChart as ReLineChart, Line, CartesianGrid } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { AnimatedWelcome } from '@/components/ui/animated-welcome';

interface DashboardOverviewProps {
  userId: string;
}

const moduleSections = {
  'Colabora': [
    {
      icon: <ShoppingBag className="h-8 w-8 text-primary" />,
      title: 'Marketplace',
      description: 'Explora servicios y productos del ecosistema.',
      href: '/dashboard/marketplace',
    },
    {
      icon: <GitFork className="h-8 w-8 text-primary" />,
      title: 'Mis Brokis',
      description: 'Gestiona tu red de clientes y proveedores.',
      href: '/dashboard/network',
    },
    {
      icon: <MessageSquareHeart className="h-8 w-8 text-primary" />,
      title: 'Mentorías',
      description: 'Conecta con mentores y resuelve dudas.',
      href: '/dashboard/mentorias',
    },
  ],
  'Gestiona': [
    {
      icon: <Landmark className="h-8 w-8 text-primary" />,
      title: 'Mis Finanzas',
      description: 'Lleva un control de tus finanzas.',
      href: '/dashboard/contabilidad',
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: 'Cotizador',
      description: 'Crea cotizaciones y facturas profesionales.',
      href: '/dashboard/cotizador',
    },
    {
      icon: <Archive className="h-8 w-8 text-primary" />,
      title: 'Mi Almacén',
      description: 'Gestiona tu inventario de productos.',
      href: '/dashboard/productos',
    },
    {
      icon: <Briefcase className="h-8 w-8 text-primary" />,
      title: 'Mis Servicios',
      description: 'Administra los servicios que ofreces.',
      href: '/dashboard/services',
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      title: 'Mis Cursos',
      description: 'Crea y gestiona tus micro-cursos.',
      href: '/dashboard/my-courses',
    },
  ],
  'Crece': [
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: 'Cursos Exprés',
      description: 'Aprende habilidades clave para crecer.',
      href: '/dashboard/cursos',
    },
    {
      icon: <HandCoins className="h-8 w-8 text-primary" />,
      title: 'Microcréditos',
      description: 'Accede a financiamiento colaborativo.',
      href: '/dashboard/creditos',
    },
    {
      icon: <FileSearch className="h-8 w-8 text-primary" />,
      title: 'Análisis IA',
      description: 'Obtén auditorías expertas de tus documentos.',
      href: '/dashboard/analisis',
    },
  ]
};

const StatsCard = ({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    {icon}
                </div>
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="h-60 w-full">
                {children}
            </div>
        </CardContent>
    </Card>
);

async function fetchCaseWithProfiles(docSnap: any): Promise<Case> {
    const data = docSnap.data() as Omit<Case, 'id' | 'client' | 'provider'>;
    const clientSnap = await getDoc(doc(db, 'users', data.clientId));
    const providerSnap = await getDoc(doc(db, 'users', data.providerId));

    return {
        id: docSnap.id,
        ...data,
        client: clientSnap.exists() ? (clientSnap.data() as UserProfile) : null,
        provider: providerSnap.exists() ? (providerSnap.data() as UserProfile) : null,
    };
}


export function DashboardOverview({ userId }: DashboardOverviewProps) {
  const { userProfile } = useAuth();
  const [clientCases, setClientCases] = useState<Case[]>([]);
  const [providerCases, setProviderCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const isProfileIncomplete = useMemo(() => {
    return !userProfile?.companyName;
  }, [userProfile]);

  const allCases = useMemo(() => {
    const combined = [...clientCases, ...providerCases];
    const uniqueCases = Array.from(new Map(combined.map(c => [c.id, c])).values());
    return uniqueCases.sort((a, b) => b.lastUpdate.toMillis() - a.lastUpdate.toMillis());
  }, [clientCases, providerCases]);

  const caseActivityData = useMemo(() => {
    const data: { name: string; created: number; completed: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthName = format(monthDate, 'MMM');
        const monthStart = startOfMonth(monthDate);
        
        const createdInMonth = allCases.filter(c => c.createdAt.toDate() >= monthStart && c.createdAt.toDate() < subMonths(monthStart, -1)).length;
        const completedInMonth = allCases.filter(c => c.status === 'completed' && c.lastUpdate.toDate() >= monthStart && c.lastUpdate.toDate() < subMonths(monthStart, -1)).length;
        
        data.push({ name: monthName, created: createdInMonth, completed: completedInMonth });
    }
    return data;
  }, [allCases]);

  const creditHistoryData = useMemo(() => {
      // Dummy data for demonstration
      const baseCredits = userProfile?.credits || 0;
      return [
          { name: 'Jan', credits: baseCredits > 50 ? baseCredits - 50 : 0 },
          { name: 'Feb', credits: baseCredits > 30 ? baseCredits - 30 : 0 },
          { name: 'Mar', credits: baseCredits + 20 },
          { name: 'Apr', credits: baseCredits + 10 },
          { name: 'May', credits: baseCredits + 40 },
          { name: 'Jun', credits: baseCredits },
      ];
  }, [userProfile?.credits]);

  useEffect(() => {
    if (!userId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    let clientLoaded = false;
    let providerLoaded = false;

    const checkLoadingDone = () => {
        if (clientLoaded && providerLoaded) {
            setLoading(false);
        }
    };

    const casesRef = collection(db, 'cases');
    
    const clientQuery = query(
      casesRef, 
      where('clientId', '==', userId), 
      orderBy('lastUpdate', 'desc')
    );
    const providerQuery = query(
      casesRef, 
      where('providerId', '==', userId), 
      orderBy('lastUpdate', 'desc')
    );

    const unsubClient = onSnapshot(clientQuery, async (snapshot) => {
        const casesPromises = snapshot.docs.map(fetchCaseWithProfiles);
        const fetchedCases = await Promise.all(casesPromises);
        setClientCases(fetchedCases);
        clientLoaded = true;
        checkLoadingDone();
    }, (error) => {
        console.error("Error fetching client cases: ", error);
        clientLoaded = true;
        checkLoadingDone();
    });

    const unsubProvider = onSnapshot(providerQuery, async (snapshot) => {
        const casesPromises = snapshot.docs.map(fetchCaseWithProfiles);
        const fetchedCases = await Promise.all(casesPromises);
        setProviderCases(fetchedCases);
        providerLoaded = true;
        checkLoadingDone();
    }, (error) => {
        console.error("Error fetching provider cases: ", error);
        providerLoaded = true;
        checkLoadingDone();
    });
    
    return () => {
      unsubClient();
      unsubProvider();
    };

  }, [userId]);
  

  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );

  if (loading) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <AnimatedWelcome text={`Bienvenido, ${userProfile?.displayName || 'Emprendedor'}`} />
            <p className="text-muted-foreground">Un resumen de tu actividad y crecimiento en el ecosistema.</p>
        </div>
        <div className="flex items-center gap-4">
            <Button asChild variant="outline">
                <Link href="/dashboard/services">
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear un Servicio
                </Link>
            </Button>
            <Button asChild>
                <Link href="/dashboard/cases/create">
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear un Caso
                </Link>
            </Button>
        </div>
      </div>
      
      {isProfileIncomplete && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>¡Bienvenido a AFKEcosystem!</AlertTitle>
          <AlertDescription>
            <div className="flex justify-between items-center">
                <p>Completa tu perfil para que otros miembros puedan encontrarte y colaborar contigo.</p>
                <Button asChild>
                    <Link href="/dashboard/profile">Completar Mi Perfil</Link>
                </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Métricas del Ecosistema</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatsCard title="Actividad de Casos" description="Casos iniciados vs. completados en los últimos 6 meses." icon={<BarChart className="h-6 w-6 text-primary" />}>
                <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={caseActivityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                        <Legend />
                        <Bar dataKey="created" fill="hsl(var(--primary))" name="Iniciados" />
                        <Bar dataKey="completed" fill="hsl(var(--secondary))" name="Completados" />
                    </ReBarChart>
                </ResponsiveContainer>
            </StatsCard>
            <StatsCard title="Historial de Créditos" description="Evolución de tu balance de créditos (simulado)." icon={<LineChart className="h-6 w-6 text-primary" />}>
                 <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={creditHistoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                        <Legend />
                        <Line type="monotone" dataKey="credits" stroke="hsl(var(--primary))" strokeWidth={2} name="Créditos" />
                    </ReLineChart>
                </ResponsiveContainer>
            </StatsCard>
        </div>
      </div>
      
       <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Casos Recientes</h2>
            <Button asChild variant="outline">
                <Link href="/dashboard/cases">Ver Todos los Casos</Link>
            </Button>
        </div>
        <div className="space-y-4">
          {allCases.length > 0 ? (
            allCases.slice(0, 3).map(caseData => {
              let perspective: 'client' | 'provider';
              if (caseData.clientId === caseData.providerId) {
                perspective = 'provider';
              } else {
                perspective = userId === caseData.clientId ? 'client' : 'provider';
              }
              return (
                <CaseCard
                  key={caseData.id}
                  caseData={caseData}
                  perspective={perspective}
                />
              );
            })
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No hay casos de apoyo recientes.</p>
              <p className="mt-2">
                <Button asChild variant="link">
                  <Link href="/dashboard/cases/create">Inicia un nuevo caso</Link>
                </Button>
              </p>
            </div>
          )}
        </div>
      </div>

       {Object.entries(moduleSections).map(([sectionTitle, modules]) => (
        <div key={sectionTitle}>
            <h2 className="text-2xl font-semibold mb-4">{sectionTitle}</h2>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {modules.map((module) => (
                  <Link href={module.href} key={module.title}>
                    <Card className="h-full transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl bg-card hover:bg-card/80">
                      <CardHeader className="items-center text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
                                {module.icon}
                            </div>
                            <CardTitle className="text-primary">{module.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                            <p className="text-sm text-center text-muted-foreground">{module.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
        </div>
       ))}
    </div>
  );
}
