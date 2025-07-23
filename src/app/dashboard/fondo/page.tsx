// src/app/dashboard/fondo/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  increment,
  addDoc
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Check, X, Hourglass, Banknote, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { add, format } from 'date-fns';

interface CreditRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  purpose: string;
  repaymentTerm: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: { toDate: () => Date };
}

interface Fund {
  totalCapital: number;
  totalLoanedOut: number;
}

export default function FondoFinancieroPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [fund, setFund] = useState<Fund | null>(null);
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fundRef = doc(db, 'fund', 'main');
    const unsubFund = onSnapshot(fundRef, (docSnap) => {
      setFund(docSnap.data() as Fund);
    });

    const requestsQuery = query(collection(db, 'credit_requests'), where('status', '==', 'pending'));
    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CreditRequest));
      setRequests(reqs);
      setLoading(false);
    });

    return () => {
        unsubFund();
        unsubRequests();
    }
  }, [userProfile, router]);
  
  const handleRequestAction = async (request: CreditRequest, action: 'approve' | 'reject') => {
    if(!fund) return;

    if (action === 'approve' && fund.totalCapital - fund.totalLoanedOut < request.amount) {
        toast({ title: 'Fondos Insuficientes', description: 'No hay suficiente capital en el fondo para aprobar este crédito.', variant: 'destructive'});
        return;
    }

    try {
        await runTransaction(db, async (transaction) => {
            const requestRef = doc(db, 'credit_requests', request.id);
            const userRef = doc(db, 'users', request.userId);
            const fundRef = doc(db, 'fund', 'main');

            if (action === 'approve') {
                const dueDate = add(new Date(), { days: parseInt(request.repaymentTerm, 10) });
                const loanData = {
                    userId: request.userId,
                    amount: request.amount,
                    repaymentTerm: request.repaymentTerm,
                    status: 'outstanding',
                    createdAt: serverTimestamp(),
                    dueDate: dueDate
                };

                const newLoanRef = doc(collection(db, 'loans'));
                transaction.set(newLoanRef, loanData);
                transaction.update(userRef, { credits: increment(request.amount) });
                transaction.update(fundRef, { totalLoanedOut: increment(request.amount) });
                transaction.update(requestRef, { status: 'approved' });

            } else { // Reject
                transaction.update(requestRef, { status: 'rejected' });
            }
        });

        toast({ title: '¡Éxito!', description: `La solicitud ha sido ${action === 'approve' ? 'aprobada' : 'rechazada'}.`});

    } catch (error) {
        console.error("Error processing request:", error);
        toast({ title: 'Error', description: 'No se pudo procesar la solicitud.', variant: 'destructive'});
    }
  };


  if (loading) {
    return <div className="p-4">Loading financial fund data...</div>;
  }

  const availableCapital = fund ? fund.totalCapital - fund.totalLoanedOut : 0;

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold">Fondo Financiero</h1>
        <p className="text-muted-foreground">Administra el capital del ecosistema y aprueba solicitudes de crédito.</p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Capital Total</CardTitle>
                <Banknote className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">${fund?.totalCapital.toLocaleString() || '0'}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Capital Prestado</CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">${fund?.totalLoanedOut.toLocaleString() || '0'}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Capital Disponible</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">${availableCapital.toLocaleString() || '0'}</div>
            </CardContent>
        </Card>
       </div>

       <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Hourglass className="h-5 w-5" />
                    Solicitudes Pendientes
                </CardTitle>
                <CardDescription>Revisa y aprueba o rechaza las solicitudes de microcrédito.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Plazo</TableHead>
                            <TableHead>Propósito</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length > 0 ? requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.userName || req.userId}</TableCell>
                                <TableCell>${req.amount.toLocaleString()}</TableCell>
                                <TableCell>{req.repaymentTerm} días</TableCell>
                                <TableCell className="max-w-xs truncate">{req.purpose}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" className="text-green-500" onClick={() => handleRequestAction(req, 'approve')}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleRequestAction(req, 'reject')}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No hay solicitudes pendientes.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
       </Card>
    </div>
  );
}
