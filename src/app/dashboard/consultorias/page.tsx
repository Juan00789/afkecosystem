// src/app/dashboard/consultorias/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Case } from '@/modules/cases/types';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { CaseCard } from '@/modules/cases/components/case-card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareText, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { subDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';


type CaseStatus = 'new' | 'in-progress' | 'completed' | 'cancelled';

export default function ConsultoriasPage() {
  const { user } = useAuth();
  const [allCases, setAllCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('new');
  const [timeFilter, setTimeFilter] = useState('all'); // State for time filter

  useEffect(() => {
    if (!user) return;

    const casesRef = collection(db, 'cases');
    const q = query(
      casesRef,
      orderBy('lastUpdate', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      const casesPromises = snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as Omit<Case, 'id' | 'client' | 'provider'>;
        
        const clientSnap = await getDoc(doc(db, 'users', data.clientId));
        const providerSnap = data.providerId ? await getDoc(doc(db, 'users', data.providerId)) : null;
        
        return { 
          id: docSnap.id, 
          ...data,
          client: clientSnap.exists() ? clientSnap.data() : null,
          provider: providerSnap && providerSnap.exists() ? providerSnap.data() : null,
        } as Case;
      });

      const casesList = await Promise.all(casesPromises);
      setAllCases(casesList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all cases: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredCases = useMemo(() => {
    let cases = allCases;
    if (activeTab !== 'all') {
      cases = cases.filter(c => c.status === activeTab);
    }
  
    if (activeTab === 'completed' && timeFilter !== 'all') {
      const days = parseInt(timeFilter, 10);
      const cutOffDate = subDays(new Date(), days);
      cases = cases.filter(c => c.lastUpdate.toDate() > cutOffDate);
    }
  
    return cases;
  }, [allCases, activeTab, timeFilter]);

  const renderSkeleton = () => (
    <div className="space-y-4">
       <Skeleton className="h-24 w-full" />
       <Skeleton className="h-24 w-full" />
       <Skeleton className="h-24 w-full" />
    </div>
  );
  
  const renderCasesList = (cases: Case[]) => {
      if (loading) return renderSkeleton();
      if (cases.length === 0) {
          return (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">No hay casos en esta categoría</h2>
                <p className="text-muted-foreground mt-2">
                    Parece que no hay proyectos con este estado. ¡Vuelve pronto!
                </p>
            </div>
          );
      }
      return (
          <div className="space-y-4">
            {cases.map((caseData) => (
              <CaseCard key={caseData.id} caseData={caseData} perspective="provider" />
            ))}
          </div>
      );
  }

  return (
    <div className="space-y-6">
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Dashboard
          </Link>
        </Button>
      </div>
       <div>
        <h1 className="text-3xl font-bold">Consultorías y Foros</h1>
        <p className="text-muted-foreground">Encuentra proyectos donde puedas ayudar o busca inspiración en el historial de la comunidad.</p>
      </div>

        <Tabs defaultValue="new" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="new">Nuevos</TabsTrigger>
                <TabsTrigger value="in-progress">En Progreso</TabsTrigger>
                <TabsTrigger value="completed">Completados</TabsTrigger>
                <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>
            <TabsContent value="new">
                {renderCasesList(filteredCases)}
            </TabsContent>
             <TabsContent value="in-progress">
                {renderCasesList(filteredCases)}
            </TabsContent>
             <TabsContent value="completed">
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="time-filter">Mostrar:</Label>
                            <Select value={timeFilter} onValueChange={setTimeFilter}>
                                <SelectTrigger className="w-[180px]" id="time-filter">
                                    <SelectValue placeholder="Seleccionar rango" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="30">Últimos 30 días</SelectItem>
                                    <SelectItem value="90">Últimos 90 días</SelectItem>
                                    <SelectItem value="365">Último año</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {renderCasesList(filteredCases)}
                </div>
            </TabsContent>
            <TabsContent value="all">
                {renderCasesList(filteredCases)}
            </TabsContent>
        </Tabs>
    </div>
  );
}
