
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search } from 'lucide-react';
import { db, getFirebaseAuth } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, getDoc, updateDoc, deleteDoc, getDocs, collectionGroup, Timestamp, serverTimestamp, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Service {
    id: string;
    name: string;
    description: string;
    price: string;
    currency: 'DOP' | 'USD';
    userId: string;
}

interface UserData {
    name?: string;
    activeRole?: 'provider' | 'client';
}

interface ProviderForClient {
    id: string; // Document ID from providers subcollection
    providerId: string; // The actual UID of the provider user
    name?: string;
    avatar?: string;
    fallback?: string;
    services?: Service[];
}

export default function ExplorePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    
    // For Client role
    const [providersWithServices, setProvidersWithServices] = useState<ProviderForClient[]>([]);

    // Shared state
    const [selectedServices, setSelectedServices] = useState<Record<string, string[]>>({});
    const [creatingCase, setCreatingCase] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const auth = getFirebaseAuth();
      const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
              setUserData(userDoc.data() as UserData);
          } else {
             router.push('/login');
          }
        } else {
          router.push('/login');
        }
      });
      return () => unsubscribeAuth();
    }, [router]);
    
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const fetchClientData = async () => {
            try {
                const providersQuery = query(collection(db, 'users', user.uid, 'providers'));
                const providersSnapshot = await getDocs(providersQuery);
                const providerConnections = providersSnapshot.docs.map(d => d.data() as { providerId: string });
                const providerIds = providerConnections.map(p => p.providerId);

                if (providerIds.length === 0) {
                    setProvidersWithServices([]);
                    setLoading(false);
                    return;
                }

                const usersQuery = query(collection(db, 'users'), where('__name__', 'in', providerIds));
                const usersSnapshot = await getDocs(usersQuery);
                const providersDataMap = new Map<string, any>(usersSnapshot.docs.map(d => [d.id, d.data()]));

                const servicesQuery = query(collection(db, 'services'), where('userId', 'in', providerIds));
                const servicesSnapshot = await getDocs(servicesQuery);
                const allServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));

                const groupedProviders = providerConnections.map(conn => {
                    const providerUser = providersDataMap.get(conn.providerId);
                    if (!providerUser) return null; 
                    
                    const providerServices = allServices.filter(s => s.userId === conn.providerId);
                    
                    return {
                        id: conn.providerId,
                        providerId: conn.providerId,
                        name: providerUser.name || 'Proveedor Desconocido',
                        avatar: providerUser.photoURL || `https://placehold.co/100x100.png`,
                        fallback: (providerUser.name || 'P').charAt(0).toUpperCase(),
                        services: providerServices,
                    };
                }).filter((p): p is ProviderForClient => p !== null);

                setProvidersWithServices(groupedProviders);
            } catch (error) {
                console.error("Error fetching providers and services: ", error);
                toast({ variant: 'destructive', title: 'Error al cargar proveedores' });
            } finally {
                setLoading(false);
            }
        };
        fetchClientData();
        
    }, [user, toast]);
    
    const handleServiceSelection = (ownerId: string, serviceId: string, isChecked: boolean) => {
        setSelectedServices(prev => {
            const currentSelection = prev[ownerId] || [];
            if (isChecked) {
                return { ...prev, [ownerId]: [...currentSelection, serviceId] };
            } else {
                return { ...prev, [ownerId]: currentSelection.filter(id => id !== serviceId) };
            }
        });
    };

    const handleCreateCase = async (partyId: string, partyName: string) => {
        if (!user || !userData?.name) return;
        
        const servicesToRequestIds = selectedServices[partyId] || [];
        if (servicesToRequestIds.length === 0) return;

        setCreatingCase(true);
        try {
            const serviceSource = providersWithServices.find(p => p.providerId === partyId)?.services || [];
            const selectedServiceDetails = serviceSource.filter(s => servicesToRequestIds.includes(s.id));

            const formatCurrency = (value: number, currency: string) => {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                }).format(value);
            };

            const totalsByCurrency: { [key: string]: number } = selectedServiceDetails.reduce((acc, service) => {
                const price = parseFloat(service.price.replace(/[^0-9.-]+/g,""));
                if (!isNaN(price)) {
                    acc[service.currency] = (acc[service.currency] || 0) + price;
                }
                return acc;
            }, {} as { [key: string]: number });
            
            const totalString = Object.entries(totalsByCurrency)
                .map(([currency, total]) => formatCurrency(total, currency))
                .join(' + ');

            const newCaseData = {
                clientId: user.uid,
                clientName: userData.name,
                providerId: partyId,
                providerName: partyName,
                services: selectedServiceDetails.map(({ id, name, price, currency }) => ({ id, name, price, currency })),
                status: 'Pendiente',
                createdAt: Timestamp.now(),
                lastUpdate: Timestamp.now(),
                financials: {
                    total: totalString || 'N/A',
                    paid: Object.keys(totalsByCurrency).length > 0 ? formatCurrency(0, Object.keys(totalsByCurrency)[0]) : 'N/A',
                    due: totalString || 'N/A'
                }
            };
            
            const newCaseRef = await addDoc(collection(db, 'cases'), newCaseData);

            toast({
                title: 'Solicitud enviada',
                description: `Se ha creado un nuevo caso con ${partyName}.`,
            });
            setSelectedServices(prev => ({ ...prev, [partyId]: [] }));
            router.push(`/dashboard/cases/${newCaseRef.id}`);

        } catch (error) {
            console.error('Error creating case: ', error);
            toast({ variant: 'destructive', title: 'Error al crear el caso' });
        } finally {
            setCreatingCase(false);
        }
    };


    if (loading) {
         return (
             <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </main>
         )
    }

    return (
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
             <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Explorar Servicios
                    </h2>
                    <p className="text-muted-foreground">
                        Explora y solicita servicios de los proveedores en tu red.
                    </p>
                </div>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Search className="h-6 w-6 text-primary"/>
                        <CardTitle>Catálogo de Servicios de tu Red</CardTitle>
                    </div>
                    <CardDescription>
                        Explora y selecciona los servicios que necesitas de tus proveedores para crear un caso.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {providersWithServices.length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                            {providersWithServices.map(provider => (
                                <AccordionItem value={provider.providerId} key={provider.providerId}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={provider.avatar} alt={provider.name} data-ai-hint="person face" />
                                                <AvatarFallback>{provider.fallback}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{provider.name}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {provider.services && provider.services.length > 0 ? (
                                            <>
                                                <Table>
                                                    <TableHeader><TableRow>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                        <TableHead>Servicio</TableHead>
                                                        <TableHead>Descripción</TableHead>
                                                        <TableHead className="text-right">Precio</TableHead>
                                                    </TableRow></TableHeader>
                                                    <TableBody>
                                                        {provider.services.map(service => (
                                                            <TableRow key={service.id}>
                                                                <TableCell>
                                                                    <Checkbox 
                                                                        id={`service-${service.id}`}
                                                                        onCheckedChange={(checked) => handleServiceSelection(provider.providerId, service.id, !!checked)}
                                                                        checked={(selectedServices[provider.providerId] || []).includes(service.id)}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="font-medium">{service.name}</TableCell>
                                                                <TableCell className="text-muted-foreground">{service.description}</TableCell>
                                                                <TableCell className="text-right">{service.price} {service.currency}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                                <div className="flex justify-end pt-4">
                                                    <Button 
                                                        onClick={() => handleCreateCase(provider.providerId, provider.name || 'Proveedor')}
                                                        disabled={creatingCase || !(selectedServices[provider.providerId] && selectedServices[provider.providerId].length > 0)}
                                                    >
                                                        {creatingCase && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Solicitar Servicios Seleccionados
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center text-muted-foreground p-4">
                                                Este proveedor no tiene servicios publicados todavía.
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <p>No hay servicios disponibles en tu red.</p>
                            <p className="text-sm mt-1">
                               Para ver servicios, <Link href="/dashboard/network" className="text-primary underline">añade proveedores a tu red</Link>.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
