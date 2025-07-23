// src/app/dashboard/analisis/financiero/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, PieChart, LineChart, TrendingUp, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, Legend, Pie, Cell, Line, CartesianGrid, BarChart as ReBarChart, PieChart as RePieChart, LineChart as ReLineChart } from 'recharts';
import type { Transaction } from '@/modules/invoicing/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3'];

export default function FinancialAnalysisPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trans);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const monthName = format(monthStart, 'MMM');
      
      const income = transactions
        .filter(t => t.type === 'income' && t.date.toDate() >= monthStart && t.date.toDate() <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions
        .filter(t => t.type === 'expense' && t.date.toDate() >= monthStart && t.date.toDate() <= monthEnd)
        .reduce((sum, t) => sum + t.amount, 0);

      return { name: monthName, Ingresos: income, Gastos: expense };
    });
  }, [transactions]);
  
  const expenseByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + t.amount);
        });
    return Array.from(categoryMap, ([name, value]) => ({ name, value }));
  }, [transactions]);
  
  const balanceOverTime = useMemo(() => {
      let balance = 0;
      const sortedTransactions = [...transactions].sort((a,b) => a.date.toDate().getTime() - b.date.toDate().getTime());
      
      const dataPoints: { date: string, balance: number }[] = [];
      
      if (sortedTransactions.length > 0) {
          let currentDate = startOfMonth(sortedTransactions[0].date.toDate());
          
          sortedTransactions.forEach(t => {
             if (startOfMonth(t.date.toDate()) > currentDate) {
                 dataPoints.push({ date: format(currentDate, 'MMM yy'), balance });
                 currentDate = startOfMonth(t.date.toDate());
             }
             balance += t.type === 'income' ? t.amount : -t.amount;
          });
          dataPoints.push({ date: format(currentDate, 'MMM yy'), balance });
      }
      return dataPoints;

  }, [transactions]);
  
  const topParties = useMemo(() => {
      const partyMap = new Map<string, { income: number, expense: number }>();
      transactions.forEach(t => {
          if (!t.relatedPartyName) return;
          const current = partyMap.get(t.relatedPartyName) || { income: 0, expense: 0 };
          if (t.type === 'income') current.income += t.amount;
          else current.expense += t.amount;
          partyMap.set(t.relatedPartyName, current);
      });
      const sorted = Array.from(partyMap, ([name, values]) => ({ name, ...values })).sort((a,b) => (b.income + b.expense) - (a.income + a.expense));
      return {
          topClients: sorted.filter(p => p.income > 0).sort((a,b) => b.income - a.income).slice(0, 5),
          topSuppliers: sorted.filter(p => p.expense > 0).sort((a,b) => b.expense - a.expense).slice(0, 5)
      }
  }, [transactions]);


  if (loading) {
    return <div>Cargando análisis...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Análisis Financiero</h1>
            <p className="text-muted-foreground">Visualiza la salud de tu negocio con métricas clave.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/contabilidad">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar a Finanzas
          </Link>
        </Button>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card>
               <CardHeader><CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5"/>Ingresos vs. Gastos Mensuales</CardTitle></CardHeader>
               <CardContent className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                       <ReBarChart data={monthlyData}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="name" fontSize={12} />
                           <YAxis fontSize={12} />
                           <Tooltip />
                           <Legend />
                           <Bar dataKey="Ingresos" fill="hsl(var(--primary))" />
                           <Bar dataKey="Gastos" fill="hsl(var(--destructive))" />
                       </ReBarChart>
                   </ResponsiveContainer>
               </CardContent>
           </Card>
           <Card>
               <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5"/>Desglose de Gastos por Categoría</CardTitle></CardHeader>
               <CardContent className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                       <RePieChart>
                           <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                               {expenseByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                           </Pie>
                           <Tooltip />
                           <Legend />
                       </RePieChart>
                   </ResponsiveContainer>
               </CardContent>
           </Card>
           <Card className="lg:col-span-2">
               <CardHeader><CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5"/>Evolución del Balance</CardTitle></CardHeader>
               <CardContent className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                       <ReLineChart data={balanceOverTime}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="date" fontSize={12} />
                           <YAxis fontSize={12} />
                           <Tooltip />
                           <Legend />
                           <Line type="monotone" dataKey="balance" name="Balance" stroke="hsl(var(--primary))" />
                       </ReLineChart>
                   </ResponsiveContainer>
               </CardContent>
           </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" />Top 5 Clientes</CardTitle></CardHeader>
                <CardContent>
                   <ul className="space-y-2">
                       {topParties.topClients.map(client => (
                           <li key={client.name} className="flex justify-between text-sm">
                               <span>{client.name}</span>
                               <span className="font-semibold">${client.income.toLocaleString()}</span>
                           </li>
                       ))}
                   </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-500" />Top 5 Proveedores/Gastos</CardTitle></CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                       {topParties.topSuppliers.map(supplier => (
                           <li key={supplier.name} className="flex justify-between text-sm">
                               <span>{supplier.name}</span>
                               <span className="font-semibold">${supplier.expense.toLocaleString()}</span>
                           </li>
                       ))}
                   </ul>
                </CardContent>
            </Card>
       </div>
    </div>
  );
}
