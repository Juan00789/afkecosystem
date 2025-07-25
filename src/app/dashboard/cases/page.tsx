// src/app/dashboard/cases/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { CaseCard } from '@/modules/cases/components/case-card';
import type { Case, UserProfile } from '@/modules/cases/types';
import { Skeleton } from '@/components/ui/skeleton';

function CaseSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
    )
}

function CasesListComponent() {
    const { user } = useAuth();
    const [clientCases, setClientCases] = useState<Case[]>([]);
    const [providerCases, setProviderCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const casesRef = collection(db, 'cases');

        const clientQuery = query(casesRef, where('clientId', '==', user.uid), orderBy('lastUpdate', 'desc'));
        const providerQuery = query(casesRef, where('providerId', '==', user.uid), orderBy('lastUpdate', 'desc'));

        const unsubClient = onSnapshot(clientQuery, async (snapshot) => {
            const casesPromises = snapshot.docs.map(fetchCaseWithProfiles);
            const fetchedCases = await Promise.all(casesPromises);
            setClientCases(fetchedCases);
        });

        const unsubProvider = onSnapshot(providerQuery, async (snapshot) => {
            const casesPromises = snapshot.docs.map(fetchCaseWithProfiles);
            const fetchedCases = await Promise.all(casesPromises);
            setProviderCases(fetchedCases);
        });

        // A simple way to stop loading, can be improved
        Promise.all([new Promise(res => setTimeout(res, 1500))]).then(() => setLoading(false));

        return () => {
            unsubClient();
            unsubProvider();
        };
    }, [user]);

    const allCases = useMemo(() => {
        const combined = [...clientCases, ...providerCases];
        return Array.from(new Map(combined.map(c => [c.id, c])).values())
                    .sort((a, b) => b.lastUpdate.toDate().getTime() - a.lastUpdate.toDate().getTime());
    }, [clientCases, providerCases]);
    
    const caseStatuses: Case['status'][] = ['new', 'in-progress', 'completed', 'cancelled'];
    const tabs = ['all', ...caseStatuses];

    const renderCaseList = (cases: Case[]) => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <CaseSkeleton key={i} />)}
                </div>
            )
        }
        if (cases.length === 0) {
            return <div className="text-center py-10 border-2 border-dashed rounded-lg"><p className="text-muted-foreground">No se encontraron casos con este estado.</p></div>;
        }
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map(caseData => {
                    const perspective = user?.uid === caseData.clientId ? 'client' : 'provider';
                    return <CaseCard key={caseData.id} caseData={caseData} perspective={perspective} />;
                })}
            </div>
        );
    };

    return (
         <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="h-6 w-6" />Mis Casos</CardTitle>
                    <CardDescription>Aquí puedes ver todos los casos en los que participas, como cliente o proveedor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            {tabs.map(tab => (
                                <TabsTrigger key={tab} value={tab} className="capitalize">{tab.replace('-', ' ')}</TabsTrigger>
                            ))}
                        </TabsList>
                        <TabsContent value="all" className="mt-4">{renderCaseList(allCases)}</TabsContent>
                        {caseStatuses.map(status => (
                            <TabsContent key={status} value={status} className="mt-4">
                                {renderCaseList(allCases.filter(c => c.status === status))}
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CasesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CasesListComponent />
        </Suspense>
    )
}
