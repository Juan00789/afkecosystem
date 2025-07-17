'use client';

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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, ArrowUpRight } from 'lucide-react';

const invoices = [
  {
    invoiceNumber: 'FAC-00123',
    client: 'Empresa Innova S.A.',
    date: '15 de Julio, 2024',
    dueDate: '15 de Agosto, 2024',
    amount: '$2,500.00',
    status: 'Pagada',
  },
  {
    invoiceNumber: 'FAC-00124',
    client: 'Diseños Creativos',
    date: '18 de Julio, 2024',
    dueDate: '1 de Agosto, 2024',
    amount: '$1,200.00',
    status: 'Pendiente',
  },
  {
    invoiceNumber: 'FAC-00125',
    client: 'Soluciones Tech',
    date: '20 de Julio, 2024',
    dueDate: '20 de Agosto, 2024',
    amount: '$3,800.00',
    status: 'Pendiente',
  },
  {
    invoiceNumber: 'FAC-00126',
    client: 'Marketing Global',
    date: '22 de Julio, 2024',
    dueDate: '7 de Agosto, 2024',
    amount: '$750.00',
    status: 'Atrasada',
  },
];

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
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Facturas</h2>
            <p className="text-muted-foreground">Crea y administra las facturas de tus clientes.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nueva Factura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Facturas</CardTitle>
          <CardDescription>
            Un listado de todas las facturas emitidas recientemente.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {invoices.map((invoice) => (
                <TableRow key={invoice.invoiceNumber}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell className="text-right">{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-end">
            <Button variant="link">Ver todas las facturas <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
        </CardFooter>
      </Card>
    </main>
  );
}
