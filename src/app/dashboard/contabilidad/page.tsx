// src/app/dashboard/contabilidad/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Landmark, DollarSign, ArrowUpCircle, ArrowDownCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: { toDate: () => Date };
  category: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];


export default function ContabilidadPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trans);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching transactions: ", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);
  
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
    };
  }, [transactions]);
  
  const barChartData = useMemo(() => {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    transactions.forEach(t => {
      const month = format(t.date.toDate(), 'MMM yyyy', { locale: es });
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        monthlyData[month].income += t.amount;
      } else {
        monthlyData[month].expenses += t.amount;
      }
    });
    return Object.keys(monthlyData).map(month => ({
      name: month,
      Ingresos: monthlyData[month].income,
      Gastos: monthlyData[month].expenses,
    })).reverse();
  }, [transactions]);
  
  const pieChartData = useMemo(() => {
    const expenseByCategory: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (!expenseByCategory[t.category]) {
          expenseByCategory[t.category] = 0;
        }
        expenseByCategory[t.category] += t.amount;
      });
    return Object.keys(expenseByCategory).map(category => ({
      name: category,
      value: expenseByCategory[category],
    }));
  }, [transactions]);

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
                <h1 className="text-3xl font-bold">Dashboard de Contabilidad</h1>
                <p className="text-muted-foreground">Una vista completa de la salud financiera de tu negocio.</p>
            </div>
        </div>
        <Button asChild size="lg">
            <Link href="/dashboard/contabilidad/transactions">
                <PlusCircle className="mr-2 h-5 w-5" />
                Gestionar Transacciones
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

       <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Análisis de Ingresos vs. Gastos</CardTitle>
                <CardDescription>Comparativa mensual de tus flujos de efectivo.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                        <Bar dataKey="Ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Desglose de Gastos</CardTitle>
                <CardDescription>Distribución de tus gastos por categoría.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                         <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>Las últimas 5 transacciones registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.slice(0, 5).map(t => (
                        <TableRow key={t.id}>
                            <TableCell className="font-medium">{t.description}</TableCell>
                            <TableCell>{t.category}</TableCell>
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
