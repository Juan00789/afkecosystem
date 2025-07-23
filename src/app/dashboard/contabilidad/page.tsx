// src/app/dashboard/contabilidad/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Landmark, DollarSign, ArrowUpCircle, ArrowDownCircle, PlusCircle, FileText, Archive, History, BarChart } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Product } from '@/modules/products/types';
import type { Transaction } from '@/modules/invoicing/types';


export default function ContabilidadPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryValue, setInventoryValue] = useState(0);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('status', '==', 'active'), orderBy('date', 'desc'));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trans);

      const income = trans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = trans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      setTotalIncome(income);
      setTotalExpenses(expenses);
      setBalance(income - expenses);
    }, (error) => {
        console.error("Error fetching transactions: ", error);
    });

    const qProducts = query(collection(db, 'products'), where('providerId', '==', user.uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const products = snapshot.docs.map(doc => doc.data() as Product);
      const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
      setInventoryValue(totalValue);
    }, (error) => {
        console.error("Error fetching products: ", error);
    });

    setLoading(false); // Can be improved to handle both listeners
    
    return () => {
        unsubTransactions();
        unsubProducts();
    };
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
        <div className="flex gap-2 flex-wrap">
             <Button asChild size="lg" variant="outline">
                <Link href="/dashboard/contabilidad/historial">
                    <History className="mr-2 h-5 w-5" />
                    Ver Historial Completo
                </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
                <Link href="/dashboard/contabilidad/invoices">
                    <FileText className="mr-2 h-5 w-5" />
                    Ver Documentos
                </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
                <Link href="/dashboard/analisis/financiero">
                    <BarChart className="mr-2 h-5 w-5" />
                    Ver Análisis
                </Link>
            </Button>
            <Button asChild size="lg">
                <Link href="/dashboard/contabilidad/transactions">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Añadir Transacción
                </Link>
            </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor de Inventario</CardTitle>
                <Archive className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-secondary">${inventoryValue.toLocaleString()}</div>
                 <p className="text-xs text-muted-foreground">Capital invertido en productos.</p>
            </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>Tus últimos 10 movimientos registrados. El historial completo está disponible.</CardDescription>
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
                    {transactions.slice(0, 10).map(t => (
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
