// src/modules/dashboard/components/dashboard-overview.tsx
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Case } from '@/modules/cases/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CaseCard } from '@/modules/cases/components/case-card';
import Link from 'next/link';
import {
  PlusCircle,
  Users,
  Briefcase,
  BookOpen,
  FileText,
  ShoppingBag,
  HandCoins,
  MessageSquareText,
  Rocket,
  Sparkles,
  Award,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DashboardOverviewProps {
  userId: string;
}

const modules = [
  {
    icon: <ShoppingBag className="h-8 w-8 text-primary" />,
    title: 'Marketplace',
    description: 'Encuentra y ofrece servicios locales.',
    href: '/dashboard/marketplace',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Cursos Exprés',
    description: 'Aprende habilidades esenciales.',
    href: '/dashboard/cursos',
  },
  {
    icon: <HandCoins className="h-8 w-8 text-primary" />,
    title: 'Microcréditos',
    description: 'Financia tu próximo proyecto.',
    href: '/dashboard/creditos',
  },
  {
    icon: <MessageSquareText className="h-8 w-8 text-primary" />,
    title: 'Consultorías',
    description: 'Conecta con expertos y comparte.',
    href: '/dashboard/consultorias',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Brokis',
    description: 'Gestiona tus clientes y proveedores.',
    href: '/dashboard/network',
  },
   {
    icon: <Briefcase className="h-8 w-8 text-primary" />,
    title: 'My Services',
    description: 'Gestiona los servicios que ofreces.',
    href: '/dashboard/services',
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: 'Quotes',
    description: 'Genera cotizaciones con IA.',
    href: '/dashboard/quotes',
  },
];

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

  const onDataLoaded = useCallback(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const casesRef = collection(db, 'cases');
    
    const clientQuery = query(
      casesRef, 
      where('clientId', '==', userId), 
      orderBy('lastUpdate', 'desc'),
      limit(5)
    );
    const providerQuery = query(
      casesRef, 
      where('providerId', '==', userId), 
      orderBy('lastUpdate', 'desc'),
      limit(5)
    );

    const unsubClient = onSnapshot(clientQuery, (snapshot) => {
        setClientCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case)));
        onDataLoaded();
    }, (error) => {
        console.error("Error fetching client cases: ", error);
        onDataLoaded();
    });

    const unsubProvider = onSnapshot(providerQuery, (snapshot) => {
        setProviderCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case)));
        onDataLoaded();
    }, (error) => {
        console.error("Error fetching provider cases: ", error);
        onDataLoaded();
    });
    
    return () => {
      unsubClient();
      unsubProvider();
    };

  }, [userId, onDataLoaded]);
  

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
            <h1 className="text-3xl font-bold">Panel Personal</h1>
            <p className="text-muted-foreground">Sigue tu progreso y oportunidades en tiempo real.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-2 text-secondary">
                <Award className="h-6 w-6" />
                <span className="text-xl font-bold">{userProfile?.credits || 0}</span>
                <span className="font-medium">Créditos</span>
            </div>
            <Button asChild>
                <Link href="/dashboard/cases/create">
                    <PlusCircle className="mr-2 h-4 w-4" /> New Case
                </Link>
            </Button>
        </div>
      </div>
      
      {isProfileIncomplete && (
        <Alert>
          <Rocket className="h-4 w-4" />
          <AlertTitle>¡Bienvenido a AFKEcosystem!</AlertTitle>
          <AlertDescription>
            <div className="flex justify-between items-center">
                <p>Completa tu perfil para que otros puedan encontrarte y empezar a colaborar.</p>
                <Button asChild>
                    <Link href="/dashboard/profile">Completar Perfil</Link>
                </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}


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


      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {allCases.length > 0 ? (
            allCases.slice(0, 5).map(caseData => (
              <CaseCard
                key={caseData.id}
                caseData={caseData}
                perspective={userId === caseData.clientId ? 'client' : 'provider'}
              />
            ))
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No recent cases.</p>
              <p className="mt-2">
                <Button asChild variant="link">
                  <Link href="/dashboard/cases/create">Create your first case</Link>
                </Button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
