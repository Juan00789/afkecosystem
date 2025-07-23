// src/app/dashboard/contabilidad/historial/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: { toDate: () => Date };
  category: string;
  paymentMethod: string;
  relatedPartyName?: string;
  status?: 'active' | 'archived';
}

export default function HistorialPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Fetch all transactions, including archived ones
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trans);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching transaction history: ", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const searchLower = searchTerm.toLowerCase();
      return (
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.relatedPartyName?.toLowerCase().includes(searchLower) ||
        t.amount.toString().includes(searchLower)
      );
    });
  }, [transactions, searchTerm]);

  const handleUnarchive = async (id: string) => {
    try {
        const transactionRef = doc(db, 'transactions', id);
        await updateDoc(transactionRef, { status: 'active' });
        toast({ title: 'Éxito', description: 'Transacción restaurada.' });
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo restaurar la transacción.', variant: 'destructive' });
    }
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard/contabilidad">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar a Finanzas
          </Link>
        </Button>
      </div>
       <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="flex items-center gap-2"><History className="h-6 w-6" />Historial de Transacciones</CardTitle>
                    <CardDescription>Un registro completo de todos tus movimientos financieros.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por descripción, categoría, cliente/proveedor o monto..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente/Proveedor</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Cargando transacciones...</TableCell></TableRow>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => (
                  <TableRow key={t.id} className={t.status === 'archived' ? 'text-muted-foreground bg-muted/20' : ''}>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>{format(t.date.toDate(), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{t.relatedPartyName || '-'}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>
                        <Badge variant={t.status === 'archived' ? 'secondary' : 'default'}>
                            {t.status === 'archived' ? 'Archivada' : 'Activa'}
                        </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center">No se encontraron transacciones.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}