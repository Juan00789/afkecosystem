// src/app/dashboard/consultorias/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Case } from '@/modules/cases/types';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { CaseCard } from '@/modules/cases/components/case-card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareText } from 'lucide-react';

export default function ConsultoriasPage() {
  const { user } = useAuth();
  const [openCases, setOpenCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const casesRef = collection(db, 'cases');
    // Query for cases that are 'new' or 'in-progress' and not created by the current user
    const q = query(
      casesRef,
      where('status', 'in', ['new', 'in-progress']),
      where('clientId', '!=', user.uid),
      orderBy('clientId'), // Firestore requires an orderBy when using a inequality filter
      orderBy('lastUpdate', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const casesPromises = snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as Omit<Case, 'id' | 'client' | 'provider'>;
        
        // Fetch client and provider profiles for each case
        const clientSnap = await getDoc(doc(db, 'users', data.clientId));
        const providerSnap = await getDoc(doc(db, 'users', data.providerId));
        
        return { 
          id: docSnap.id, 
          ...data,
          client: clientSnap.exists() ? clientSnap.data() : null,
          provider: providerSnap.exists() ? providerSnap.data() : null,
        } as Case;
      });

      const casesList = await Promise.all(casesPromises);
      setOpenCases(casesList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching open cases: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderSkeleton = () => (
    <div className="space-y-4">
       <Skeleton className="h-24 w-full" />
       <Skeleton className="h-24 w-full" />
       <Skeleton className="h-24 w-full" />
    </div>
  );

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold">Consultorías y Foros</h1>
        <p className="text-muted-foreground">Encuentra proyectos donde puedas ayudar o busca inspiración.</p>
      </div>
      
      {loading ? (
        renderSkeleton()
      ) : openCases.length > 0 ? (
        <div className="space-y-4">
          {openCases.map((caseData) => (
            <CaseCard key={caseData.id} caseData={caseData} perspective="provider" />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No hay casos abiertos</h2>
            <p className="text-muted-foreground mt-2">
                Parece que todos los proyectos están al día. ¡Vuelve pronto!
            </p>
        </div>
      )}
    </div>
  );
}
