
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, ArrowUpRight, PlusCircle } from "lucide-react";
import Link from "next/link";


// Mock data - in the future this will come from Firestore
const cases: any[] = [];

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Completado':
            return 'default';
        case 'En Progreso':
            return 'secondary';
        case 'Pendiente':
            return 'outline';
        default:
            return 'destructive';
    }
}


export default function CasesPage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Casos</h2>
            <p className="text-muted-foreground">Administra los casos y solicitudes de tus clientes.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo Caso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Casos</CardTitle>
          <CardDescription>
            Un listado de todos tus casos activos y pasados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Última Actualización</TableHead>
                 <TableHead className="text-right">Monto</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.length > 0 ? (
                cases.map((c) => (
                  <TableRow key={c.id}>
                     <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={c.avatar} alt={c.client} data-ai-hint="company logo" />
                                <AvatarFallback>{c.fallback}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{c.client}</span>
                        </div>
                    </TableCell>
                    <TableCell>{c.service}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(c.status)}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{c.lastUpdate}</TableCell>
                    <TableCell className="text-right">{c.amount}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/cases/${c.id}`}>Ver Detalles</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No tienes casos registrados. ¡Crea uno para empezar!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-end">
            <Button variant="link">Ver todos los casos <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
        </CardFooter>
      </Card>
    </main>
  );
}
