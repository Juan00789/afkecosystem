
'use client';

import { useState, useEffect } from 'react';
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
import { ArrowUpRight, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { db, getFirebaseAuth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc, or } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Case {
  id: string;
  clientName: string;
  providerName: string;
  services: { name: string }[];
  status: string;
  lastUpdate: { toDate: () => Date };
  clientId: string;
  providerId: string;
}

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
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ activeRole?: string }>({});
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const casesQuery = query(
      collection(db, 'cases'),
      or(where('clientId', '==', user.uid), where('providerId', '==', user.uid))
    );
    
    const unsubscribe = onSnapshot(casesQuery, (snapshot) => {
      const casesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
      setCases(casesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cases: ", error);
      toast({
          variant: 'destructive',
          title: 'Error al cargar casos',
          description: 'No se pudieron obtener los datos.'
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  const isProvider = userData.activeRole === 'provider';

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Casos</h2>
            <p className="text-muted-foreground">Administra los casos y solicitudes de tus clientes.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/services">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Caso
          </Link>
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
          {loading ? (
             <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isProvider ? 'Cliente' : 'Proveedor'}</TableHead>
                  <TableHead>Servicio(s)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Última Actualización</TableHead>
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
                                  {/* Future: fetch avatar from user profile */}
                                  <AvatarFallback>{isProvider ? c.clientName.charAt(0) : c.providerName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{isProvider ? c.clientName : c.providerName}</span>
                          </div>
                      </TableCell>
                      <TableCell>{c.services?.map(s => s.name).join(', ') || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(c.status)}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {c.lastUpdate ? formatDistanceToNow(c.lastUpdate.toDate(), { addSuffix: true, locale: es }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/cases/${c.id}`}>Ver Detalles</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No tienes casos registrados. ¡Crea uno para empezar!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="justify-end">
            <Button variant="link">Ver todos los casos <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
        </CardFooter>
      </Card>
    </main>
  );
}
