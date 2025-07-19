
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, ArrowUpRight, Printer, Download, Loader2 } from 'lucide-react';
import { db, getFirebaseAuth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  clientName: string;
  providerName: string;
  createdAt: { toDate: () => Date };
  dueDate: { toDate: () => Date };
  amount: string;
  status: 'Pagada' | 'Pendiente' | 'Atrasada';
  clientId: string;
  providerId: string;
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Pagada':
            return 'default';
        case 'Pendiente':
            return 'secondary';
        case 'Atrasada':
            return 'destructive';
        default:
            return 'outline';
    }
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribeAuth = auth.onAuthStateChanged(setUser);
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);

    const invoicesQuery = query(
      collection(db, 'invoices'),
      or(where('clientId', '==', user.uid), where('providerId', '==', user.uid))
    );
    
    const unsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
      const invoicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(invoicesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching invoices: ", error);
      toast({
          variant: 'destructive',
          title: 'Error al cargar facturas',
          description: 'No se pudieron obtener los datos.'
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);


  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Facturas</h2>
            <p className="text-muted-foreground">Crea y administra las facturas de tus clientes.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Facturas</CardTitle>
          <CardDescription>
            Un listado de todas las facturas emitidas y recibidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura #</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha de Emisión</TableHead>
                <TableHead>Fecha de Vencimiento</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">#{invoice.id.substring(0, 6).toUpperCase()}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{invoice.createdAt ? format(invoice.createdAt.toDate(), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                    <TableCell>{invoice.dueDate ? format(invoice.dueDate.toDate(), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                    <TableCell className="text-right">{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                  <Printer className="mr-2 h-4 w-4" />
                                  Imprimir
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Descargar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No hay facturas para mostrar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
        <CardFooter className="justify-end">
            <Button variant="link">Ver todas las facturas <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
        </CardFooter>
      </Card>
    </main>
  );
}
