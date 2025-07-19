
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
import { ArrowUpRight, PlusCircle, Briefcase, Users, UserCheck, Activity, Loader2, MessageSquare, ExternalLink, ListTodo, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { db, getFirebaseAuth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc, or, limit, orderBy, getDocs, collectionGroup, Timestamp } from 'firebase/firestore';
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
  lastUpdate: Timestamp;
  clientId: string;
  providerId: string;
  lastComment?: {
      text: string;
      userName: string;
      createdAt: Timestamp;
  }
}

interface Client {
    id: string;
}

interface Service {
    id: string;
    name: string;
    price: string;
    currency: string;
}

interface ActivityItem {
    id: string;
    caseId: string;
    text: string;
    userName: string;
    createdAt: Timestamp;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ activeRole?: string }>({});
  const [loading, setLoading] = useState(true);

  const [cases, setCases] = useState<Case[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [providerCount, setProviderCount] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  
  useEffect(() => {
    setLoading(true);
    const auth = getFirebaseAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
      // setLoading(false); // Loading will be set to false inside the main data fetch useEffect
    });
    return () => unsubscribeAuth();
  }, []);
  
   useEffect(() => {
    if (!user) {
        setCases([]);
        setActivities([]);
        setClientCount(0);
        setProviderCount(0);
        setServices([]);
        setLoading(false);
        return;
    }

    setLoading(true);

    const casesAsClientQuery = query(collection(db, 'cases'), where('clientId', '==', user.uid));
    const casesAsProviderQuery = query(collection(db, 'cases'), where('providerId', '==', user.uid));
    
    const fetchAndCombineCases = async () => {
        try {
            const [clientSnapshot, providerSnapshot] = await Promise.all([
                getDocs(casesAsClientQuery),
                getDocs(casesAsProviderQuery)
            ]);

            const clientCases = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
            const providerCases = providerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));

            const allCasesMap = new Map<string, Case>();
            [...clientCases, ...providerCases].forEach(c => allCasesMap.set(c.id, c));
            const combinedCases = Array.from(allCasesMap.values()).sort((a, b) => b.lastUpdate.toMillis() - a.lastUpdate.toMillis());

            const casesWithComments = await Promise.all(combinedCases.map(async (caseItem) => {
                const commentsQuery = query(
                    collection(db, 'cases', caseItem.id, 'comments'),
                    orderBy('createdAt', 'desc'),
                    limit(1)
                );
                const commentsSnapshot = await getDocs(commentsQuery);
                if (!commentsSnapshot.empty) {
                    const lastCommentDoc = commentsSnapshot.docs[0];
                    caseItem.lastComment = {
                        text: lastCommentDoc.data().text,
                        userName: lastCommentDoc.data().userName,
                        createdAt: lastCommentDoc.data().createdAt,
                    };
                }
                return caseItem;
            }));
            
            setCases(casesWithComments);

            // Derive activities
            const activityData = casesWithComments
                .filter(c => c.lastComment)
                .map(c => ({
                    id: c.id + c.lastComment!.createdAt.seconds,
                    caseId: c.id,
                    text: c.lastComment!.text,
                    userName: c.lastComment!.userName,
                    createdAt: c.lastComment!.createdAt,
                }))
                .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
                .slice(0, 5);
            setActivities(activityData);

        } catch (error) {
            console.error("Error fetching dashboard cases: ", error);
            toast({ variant: 'destructive', title: 'Error al cargar casos', description: 'Por favor, intenta recargar la página.' });
        } finally {
            setLoading(false);
        }
    };

    fetchAndCombineCases();

    // Fetch clients
    const clientsQuery = query(collection(db, 'clients'), where('providerId', '==', user.uid));
    const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
        setClientCount(snapshot.size);
    });

    // Fetch providers
     const providersQuery = query(collection(db, 'users', user.uid, 'providers'));
     const unsubscribeProviders = onSnapshot(providersQuery, (snapshot) => {
        setProviderCount(snapshot.size);
     });

    // Fetch services
    const servicesQuery = query(collection(db, 'services'), where('userId', '==', user.uid));
    const unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
        setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });


    // Real-time updates for cases
    const unsubscribeCasesClient = onSnapshot(casesAsClientQuery, () => fetchAndCombineCases());
    const unsubscribeCasesProvider = onSnapshot(casesAsProviderQuery, () => fetchAndCombineCases());


    return () => {
      unsubscribeClients();
      unsubscribeProviders();
      unsubscribeServices();
      unsubscribeCasesClient();
      unsubscribeCasesProvider();
    };
  }, [user, toast]);


  const activeCases = cases.filter(c => c.status === 'En Progreso');
  const activeCasesCount = activeCases.length;
  const nextTaskCase = activeCases.length > 0 ? activeCases[0] : null;

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Completado': return 'default';
        case 'En Progreso': return 'secondary';
        case 'Pendiente': return 'outline';
        default: return 'destructive';
    }
  }
  
  if (loading) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
     );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Resumen General</h2>
                <p className="text-muted-foreground">Bienvenido de nuevo a tu centro de mando.</p>
            </div>
            <Button asChild>
                <Link href="/dashboard/network">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir a tu Red
                </Link>
            </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Casos Activos</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeCasesCount}</div>
                    <p className="text-xs text-muted-foreground">{activeCasesCount} {activeCasesCount === 1 ? 'caso en progreso' : 'casos en progreso'}.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tus Clientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{clientCount}</div>
                    <p className="text-xs text-muted-foreground">Clientes registrados en tu red.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tus Proveedores</CardTitle>
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{providerCount}</div>
                    <p className="text-xs text-muted-foreground">Proveedores conectados en tu red.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pulso del Ecosistema</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Tranquilo</div>
                    <p className="text-xs text-muted-foreground">El sistema está listo para la acción.</p>
                </CardContent>
            </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Casos Recientes</CardTitle>
                    <CardDescription>
                        Los últimos casos que han tenido actividad.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Contraparte</TableHead>
                                <TableHead>Servicio(s)</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Última Actualización</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cases.length > 0 ? (
                              cases.slice(0, 5).map((c) => {
                                const isProviderInCase = c.providerId === user?.uid;
                                const otherPartyName = isProviderInCase ? c.clientName : c.providerName;

                                return (
                                <TableRow key={c.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback>{otherPartyName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{otherPartyName}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{c.services?.map(s => s.name).join(', ') || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(c.status)}>
                                            {c.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{c.lastUpdate ? formatDistanceToNow(c.lastUpdate.toDate(), { addSuffix: true, locale: es }) : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                      <Button asChild variant="outline" size="sm">
                                          <Link href={`/dashboard/cases/${c.id}`}>Ver Detalles</Link>
                                      </Button>
                                    </TableCell>
                                </TableRow>
                                )
                              })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No tienes casos registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button variant="link" asChild>
                        <Link href="/dashboard/cases">
                            Ver todos los casos <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>
                        Te mantendré al tanto de las últimas interacciones en tu ecosistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activities.length > 0 ? (
                        activities.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-4">
                                <div className="bg-secondary p-2 rounded-full">
                                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm">
                                        <span className="font-medium text-primary">{activity.userName}</span> comentó en <Link href={`/dashboard/cases/${activity.caseId}`} className="font-medium hover:underline">un caso</Link>: "{activity.text.length > 50 ? `${activity.text.substring(0, 50)}...` : activity.text}"
                                    </p>
                                    <p className="text-xs text-muted-foreground">{activity.createdAt ? formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true, locale: es }) : ''}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md">
                            <p className="text-muted-foreground text-center px-4">Cuando haya actividad en tus casos, aparecerá aquí.</p>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="justify-end">
                    <Button variant="link">Ver toda la actividad <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
                </CardFooter>
            </Card>
        </div>
        <div className="grid grid-cols-1 pt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Tus Servicios Ofrecidos</CardTitle>
                    <CardDescription>
                        Un vistazo rápido a tu catálogo de servicios actual.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {services.length > 0 ? (
                         <ul className="space-y-2">
                            {services.slice(0, 5).map(service => (
                                <li key={service.id} className="flex justify-between items-center p-2 rounded-md bg-secondary">
                                    <span className="font-medium">{service.name}</span>
                                    <span className="text-muted-foreground">{service.price} {service.currency}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-md text-center">
                            <ListTodo className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Aún no has añadido ningún servicio.</p>
                            <Button variant="link" asChild className="mt-1">
                                <Link href="/dashboard/services">Crea tu primer servicio</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-end">
                     <Button variant="link" asChild>
                        <Link href="/dashboard/services">
                            Gestionar todos los servicios <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
