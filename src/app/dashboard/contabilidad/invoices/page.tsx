// src/app/dashboard/contabilidad/invoices/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import type { Invoice, Transaction } from '@/modules/invoicing/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DocumentsPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenseDocs, setExpenseDocs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const qInvoices = query(collection(db, 'invoices'), where('providerId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubInvoices = onSnapshot(qInvoices, (snapshot) => {
      const invs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(invs);
    }, (error) => {
      console.error("Error fetching invoices: ", error);
    });
    
    const qExpenses = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('type', '==', 'expense'), where('documentUrl', '!=', null), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setExpenseDocs(docs);
    });
    
    setLoading(false); // Can be improved
    
    return () => {
        unsubInvoices();
        unsubExpenses();
    };
  }, [user]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'sent': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

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
          <CardTitle>Mis Documentos Financieros</CardTitle>
          <CardDescription>Un historial de todas tus facturas de ingreso y gasto.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="income" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="income">Facturas de Ingreso</TabsTrigger>
                    <TabsTrigger value="expense">Facturas de Gasto (Recibos)</TabsTrigger>
                </TabsList>
                <TabsContent value="income">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center">Cargando facturas...</TableCell></TableRow>
                        ) : invoices.length > 0 ? (
                            invoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.clientName}</TableCell>
                                <TableCell>{format(invoice.createdAt.toDate(), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                <Badge variant={getStatusVariant(invoice.status)}>
                                    {invoice.status}
                                </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                ${invoice.total.toLocaleString()}
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="text-center">No has emitido ninguna factura aún.</TableCell></TableRow>
                        )}
                        </TableBody>
                    </Table>
                </TabsContent>
                 <TabsContent value="expense">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right">Documento</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Cargando recibos...</TableCell></TableRow>
                            ) : expenseDocs.length > 0 ? (
                                expenseDocs.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.description}</TableCell>
                                    <TableCell>{doc.relatedPartyName || '-'}</TableCell>
                                    <TableCell>{format(doc.date.toDate(), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="text-right font-semibold text-red-500">
                                    -${doc.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="icon">
                                            <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="text-center">No has registrado ningún gasto con factura.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
