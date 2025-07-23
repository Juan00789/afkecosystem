// src/app/dashboard/inversiones/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, documentId } from 'firebase/firestore';
import type { Case, Investment } from '@/modules/cases/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Briefcase, PiggyBank, Search, BarChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const InvestmentPortfolioCard = ({ investment, caseData }: { investment: Investment & { caseId: string }, caseData: Case | undefined }) => {
    if (!caseData) return null;
    const potentialReturn = investment.amount * 1.10; // 10% bonus

    const getStatusVariant = (status: string) => {
        switch (status) {
          case 'in-progress': return 'secondary';
          case 'completed': return 'default';
          case 'cancelled': return 'destructive';
          default: return 'outline';
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{caseData.title}</CardTitle>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Proveedor: {caseData.provider?.displayName}</span>
                     <Badge variant={getStatusVariant(caseData.status)}>{caseData.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-muted-foreground">Invertido</p>
                    <p className="text-xl font-bold">{investment.amount.toLocaleString()} créditos</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Retorno Potencial</p>
                    <p className="text-xl font-bold text-green-500">{potentialReturn.toLocaleString()} créditos</p>
                </div>
            </CardContent>
             <CardFooter>
                <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/dashboard/cases/${investment.caseId}`}>Ver Caso</Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

const InvestmentOpportunityCard = ({ caseData }: { caseData: Case }) => {
    return (
        <Card className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
                <CardTitle className="text-lg">{caseData.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={caseData.provider?.photoURL} />
                        <AvatarFallback>{caseData.provider?.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <span>{caseData.provider?.displayName}</span>
                </div>
            </CardHeader>
            <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{caseData.description}</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={`/dashboard/cases/${caseData.id}`}>Ver y Invertir</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}


export default function InversionesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myInvestments, setMyInvestments] = useState<(Investment & { caseId: string })[]>([]);
  const [investedCases, setInvestedCases] = useState<Record<string, Case>>({});
  const [openOpportunities, setOpenOpportunities] = useState<Case[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch My Investments
    const investmentsQuery = query(collection(db, 'investments'), where('investorId', '==', user.uid));
    const unsubscribeInvestments = onSnapshot(investmentsQuery, async (snapshot) => {
        const userInvestments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment & { caseId: string }));
        setMyInvestments(userInvestments);

        if (userInvestments.length > 0) {
            const caseIds = [...new Set(userInvestments.map(inv => inv.caseId))];
            const casesQuery = query(collection(db, 'cases'), where(documentId(), 'in', caseIds));
            const casesSnapshot = await getDocs(casesQuery);
            const casesData = casesSnapshot.docs.reduce((acc, docSnap) => {
                acc[docSnap.id] = {
                    id: docSnap.id,
                    ...docSnap.data(),
                } as Case;
                return acc;
            }, {} as Record<string, Case>);
            setInvestedCases(casesData);
        }
    });

    // Fetch Open Opportunities
    const opportunitiesQuery = query(collection(db, 'cases'), where('status', 'in', ['new', 'in-progress']), where('clientId', '!=', user.uid), where('providerId', '!=', user.uid));
    const unsubscribeOpps = onSnapshot(opportunitiesQuery, async (snapshot) => {
        const oppsPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const clientSnap = await getDoc(doc(db, 'users', data.clientId));
            const providerSnap = await getDoc(doc(db, 'users', data.providerId));
            return {
                id: docSnap.id,
                ...data,
                client: clientSnap.exists() ? clientSnap.data() : null,
                provider: providerSnap.exists() ? providerSnap.data() : null,
            } as Case
        });
        const oppsData = await Promise.all(oppsPromises);
        setOpenOpportunities(oppsData);
        setLoading(false);
    });

    return () => {
        unsubscribeInvestments();
        unsubscribeOpps();
    }
  }, [user]);

  const totalInvested = myInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  const potentialReturn = totalInvested * 1.10;

  if (loading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Dashboard
          </Link>
        </Button>
      </div>

       <Card className="bg-gradient-to-br from-primary/10 to-card">
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              Tu Portafolio de Inversiones
            </CardTitle>
            <CardDescription>Invierte en el ecosistema, gana con el éxito de otros.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="p-4 rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground">Total Invertido</p>
                    <p className="text-3xl font-bold">{totalInvested.toLocaleString()} créditos</p>
                </div>
                <div className="p-4 rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground">Retorno Potencial (+10%)</p>
                    <p className="text-3xl font-bold text-green-500">{potentialReturn.toLocaleString()} créditos</p>
                </div>
                <div className="p-4 rounded-lg bg-card">
                    <p className="text-sm text-muted-foreground">Inversiones Activas</p>
                    <p className="text-3xl font-bold">{myInvestments.length}</p>
                </div>
            </div>
          </CardContent>
       </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Search className="h-6 w-6"/>Oportunidades de Inversión</h2>
        {openOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {openOpportunities.map(opp => <InvestmentOpportunityCard key={opp.id} caseData={opp} />)}
            </div>
        ) : (
            <p className="text-muted-foreground text-center py-10">No hay casos abiertos para inversión en este momento.</p>
        )}
      </div>

       <Separator />

       <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Briefcase className="h-6 w-6"/>Mi Portafolio</h2>
            {myInvestments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myInvestments.map(inv => <InvestmentPortfolioCard key={inv.id} investment={inv} caseData={investedCases[inv.caseId]} />)}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-10">Aún no has realizado ninguna inversión.</p>
            )}
        </div>

    </div>
  );
}
