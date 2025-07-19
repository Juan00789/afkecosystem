// src/modules/dashboard/components/dashboard-overview.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Case } from '@/modules/cases/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CaseCard } from '@/modules/cases/components/case-card';
import Link from 'next/link';
import { PlusCircle, Users, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardOverviewProps {
  userId: string;
}

export function DashboardOverview({ userId }: DashboardOverviewProps) {
  const [clientCases, setClientCases] = useState<Case[]>([]);
  const [providerCases, setProviderCases] = useState<Case[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [providerCount, setProviderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const casesRef = collection(db, 'cases');

    // Listener for cases where user is the client
    const clientCasesQuery = query(
      casesRef,
      where('clientId', '==', userId),
      orderBy('lastUpdate', 'desc'),
      limit(5)
    );

    // Listener for cases where user is the provider
    const providerCasesQuery = query(
      casesRef,
      where('providerId', '==', userId),
      orderBy('lastUpdate', 'desc'),
      limit(5)
    );

    const unsubscribeClientCases = onSnapshot(clientCasesQuery, (snapshot) => {
      const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
      setClientCases(cases);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching client cases:", error);
      setLoading(false);
    });

    const unsubscribeProviderCases = onSnapshot(providerCasesQuery, (snapshot) => {
      const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
      setProviderCases(cases);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching provider cases:", error);
      setLoading(false);
    });

    // Listener for network counts
    const networkRef = collection(db, 'users');
    const clientCountQuery = query(networkRef, where('network.providers', 'array-contains', userId));
    const providerCountQuery = query(networkRef, where('network.clients', 'array-contains', userId));
    
    // Note: Firestore doesn't support direct count queries efficiently on the client side without reading documents.
    // For simplicity here, we fetch and count. For large scale apps, a backend counter would be better.
    const unsubscribeClientCount = onSnapshot(clientCountQuery, (snapshot) => {
        setClientCount(snapshot.size);
    });

    // This is a simplification. A user's provider list is on their own document.
    // The query should be on the user's own doc.
    const userDocRef = collection(db, 'users');
    const unsubscribeProviderCount = onSnapshot(userDocRef, (snapshot) => {
        const currentUserDoc = snapshot.docs.find(doc => doc.id === userId);
        if (currentUserDoc?.data()?.network?.providers) {
            setProviderCount(currentUserDoc.data().network.providers.length);
        } else {
            setProviderCount(0);
        }
    });


    return () => {
      unsubscribeClientCases();
      unsubscribeProviderCases();
      unsubscribeClientCount();
      unsubscribeProviderCount();
    };
  }, [userId]);
  
  const allCases = useMemo(() => {
    const combined = [...clientCases, ...providerCases];
    // Deduplicate and sort
    const uniqueCases = Array.from(new Map(combined.map(c => [c.id, c])).values());
    return uniqueCases.sort((a, b) => b.lastUpdate.toMillis() - a.lastUpdate.toMillis());
  }, [clientCases, providerCases]);


  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/dashboard/cases/create">
            <PlusCircle className="mr-2 h-4 w-4" /> New Case
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
            <p className="text-xs text-muted-foreground">
              Total clients you are providing services for.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Providers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providerCount}</div>
            <p className="text-xs text-muted-foreground">
             Total providers you have hired.
            </p>
          </CardContent>
        </Card>
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
