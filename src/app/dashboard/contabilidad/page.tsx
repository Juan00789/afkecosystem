// src/app/dashboard/contabilidad/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Landmark, DollarSign, ArrowUpCircle, ArrowDownCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: { toDate: () => Date };
}

export default function ContabilidadPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trans);

      const income = trans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = trans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      setTotalIncome(income);
      setTotalExpenses(expenses);
      setBalance(income - expenses);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching transactions: ", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

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

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Landmark className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold">Mis Finanzas</h1>
                <p className="text-muted-foreground">Una vista simple de la salud financiera de tu negocio.</p>
            </div>
        </div>
        <Button asChild size="lg">
            <Link href="/dashboard/contabilidad/transactions">
                <PlusCircle className="mr-2 h-5 w-5" />
                Añadir Transacción
            </Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-gradient-to-br from-primary/20 to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-extrabold text-primary">${balance.toLocaleString()}</div>
                <p className="text-xs text-primary/80">Tu capital actual.</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-green-500">${totalIncome.toLocaleString()}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-red-500">${totalExpenses.toLocaleString()}</div>
            </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Historial de Transacciones</CardTitle>
            <CardDescription>Todas tus transacciones registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map(t => (
                        <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.description}</TableCell>
                            <TableCell>{format(t.date.toDate(), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {transactions.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-4">No hay transacciones registradas.</p>
            )}
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
