
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, PlusCircle, ListTodo, Loader2, Search, Edit, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, getDoc, updateDoc, deleteDoc, getDocs, collectionGroup, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Service {
    id: string;
    name: string;
    description: string;
    price: string;
    userId: string;
}

interface UserData {
    name?: string;
    activeRole?: 'provider' | 'client';
}

interface ClientForProvider {
    id: string; // The client's UID from the users collection.
    name: string;
}

interface ProviderForClient {
    id: string; // Document ID from providers subcollection
    providerId: string; // The actual UID of the provider user
    name?: string;
    avatar?: string;
    fallback?: string;
    services?: Service[];
}

export default function ServicesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    
    // For Provider role
    const [myServices, setMyServices] = useState<Service[]>([]);
    const [myClients, setMyClients] = useState<ClientForProvider[]>([]);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    
    // For Client role
    const [providersWithServices, setProvidersWithServices] = useState<ProviderForClient[]>([]);

    // Shared state
    const [selectedServices, setSelectedServices] = useState<Record<string, string[]>>({});
    const [creatingCase, setCreatingCase] = useState(false);
    const [newService, setNewService] = useState({ name: '', description: '', price: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
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
        if (!user || !userData?.activeRole) {
            setLoading(false);
            return;
        }

        setLoading(true);

        if (userData.activeRole === 'provider') {
            const fetchProviderData = async () => {
                try {
                    // Fetch services
                    const servicesQuery = query(collection(db, 'services'), where('userId', '==', user.uid));
                    const servicesSnapshot = await getDocs(servicesQuery);
                    setMyServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));

                    // Fetch clients
                    const clientsQuery = query(collection(db, 'clients'), where('providerId', '==', user.uid));
                    const clientsSnapshot = await getDocs(clientsQuery);
                    const clientIds = clientsSnapshot.docs.map(doc => doc.data().userId).filter(Boolean); // Filter out potential undefined
                    
                    if (clientIds.length > 0) {
                        const usersQuery = query(collection(db, 'users'), where('__name__', 'in', clientIds));
                        const usersSnapshot = await getDocs(usersQuery);
                        setMyClients(usersSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name || 'Cliente sin nombre' })));
                    } else {
                         setMyClients([]);
                    }
                } catch (error) {
                    console.error("Error fetching provider data:", error);
                    toast({ variant: 'destructive', title: 'Error al cargar datos' });
                } finally {
                    setLoading(false);
                }
            };
            fetchProviderData();
        }

        if (userData.activeRole === 'client') {
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
                        const providerServices = allServices.filter(s => s.userId === conn.providerId);
                        if (!providerUser || providerServices.length === 0) return null;
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
        }
    }, [user, userData?.activeRole, toast]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewService(prev => ({...prev, [name]: value}));
    }
    
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editingService) return;
        const { name, value } = e.target;
        setEditingService(prev => ({...prev!, [name]: value}));
    }

    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, 'services'), {
                ...newService,
                userId: user.uid, 
                createdAt: Timestamp.now(),
            });
            setMyServices(prev => [...prev, {id: docRef.id, ...newService, userId: user.uid}]);
            toast({ title: 'Servicio guardado' });
            setNewService({ name: '', description: '', price: '' }); 
        } catch (error) {
            console.error('Error al añadir servicio:', error);
            toast({ variant: 'destructive', title: 'Error al guardar' });
        } finally {
            setSaving(false);
        }
    }
    
    const handleUpdateService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingService) return;
        setSaving(true);
        try {
            const serviceRef = doc(db, 'services', editingService.id);
            await updateDoc(serviceRef, {
                name: editingService.name,
                description: editingService.description,
                price: editingService.price,
            });
            setMyServices(prev => prev.map(s => s.id === editingService.id ? editingService : s));
            toast({ title: 'Servicio actualizado' });
            setIsEditDialogOpen(false);
            setEditingService(null);
        } catch (error) {
             console.error('Error al actualizar servicio:', error);
            toast({ variant: 'destructive', title: 'Error al actualizar' });
        } finally {
            setSaving(false);
        }
    }

    const handleDeleteService = async (serviceId: string) => {
         try {
            await deleteDoc(doc(db, 'services', serviceId));
            setMyServices(prev => prev.filter(s => s.id !== serviceId));
            toast({ title: 'Servicio eliminado' });
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
            toast({ variant: 'destructive', title: 'Error al eliminar' });
        }
    }

    const openEditDialog = (service: Service) => {
        setEditingService(service);
        setIsEditDialogOpen(true);
    }
    
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

    const handleCreateCase = async (partyId: string, partyName: string, isProviderInitiated: boolean) => {
        if (!user || !userData?.name) return;
        
        const servicesToRequestIds = selectedServices[partyId] || [];
        if (servicesToRequestIds.length === 0) return;

        setCreatingCase(true);
        try {
            const serviceSource = isProviderInitiated ? myServices : providersWithServices.find(p => p.providerId === partyId)?.services || [];
            const selectedServiceDetails = serviceSource.filter(s => servicesToRequestIds.includes(s.id));
            
            const total = selectedServiceDetails.reduce((acc, service) => {
                const price = parseFloat(service.price.replace(/[^0-9.-]+/g,""));
                return isNaN(price) ? acc : acc + price;
            }, 0) || 0;

            const newCaseData = {
                clientId: isProviderInitiated ? partyId : user.uid,
                clientName: isProviderInitiated ? partyName : userData.name,
                providerId: isProviderInitiated ? user.uid : partyId,
                providerName: isProviderInitiated ? userData.name : partyName,
                services: selectedServiceDetails,
                status: 'Pendiente',
                createdAt: Timestamp.now(),
                lastUpdate: Timestamp.now(),
                financials: {
                    total: `$${total.toFixed(2)}`,
                    paid: '$0.00',
                    due: `$${total.toFixed(2)}`
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
            toast({ variant: 'destructive', title: 'Error al crear el caso', description: 'Por favor, revisa las reglas de seguridad y los datos del caso.' });
        } finally {
            setCreatingCase(false);
        }
    };


    const isProvider = userData?.activeRole === 'provider';

    if (loading) {
         return (
             <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </main>
         )
    }

    const renderProviderView = () => (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Crear Nuevo Caso</CardTitle>
                        <CardDescription>Selecciona un cliente y los servicios para iniciar un nuevo caso.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="client-select">Cliente</Label>
                            <Select onValueChange={setSelectedClient} disabled={myClients.length === 0}>
                                <SelectTrigger id="client-select">
                                    <SelectValue placeholder={myClients.length > 0 ? "Elige un cliente" : "No tienes clientes"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {myClients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedClient && (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                <Label>Servicios a Incluir</Label>
                                {myServices.length > 0 ? myServices.map(service => (
                                    <div key={service.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`service-provider-${service.id}`}
                                            onCheckedChange={(checked) => handleServiceSelection(selectedClient, service.id, !!checked)}
                                            checked={(selectedServices[selectedClient] || []).includes(service.id)}
                                        />
                                        <label htmlFor={`service-provider-${service.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {service.name} ({service.price})
                                        </label>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">No tienes servicios para añadir.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button 
                            onClick={() => handleCreateCase(selectedClient!, myClients.find(c => c.id === selectedClient)?.name || '', true)}
                            disabled={!selectedClient || creatingCase || !(selectedServices[selectedClient!] && selectedServices[selectedClient!].length > 0)}
                        >
                            {creatingCase && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Caso
                        </Button>
                    </CardFooter>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Añadir Servicio al Catálogo</CardTitle>
                    </CardHeader>
                    <form onSubmit={handleAddService}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Servicio</Label>
                                <Input id="name" name="name" value={newService.name} onChange={handleInputChange} required disabled={saving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea id="description" name="description" value={newService.description} onChange={handleInputChange} disabled={saving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Precio</Label>
                                <Input id="price" name="price" value={newService.price} onChange={handleInputChange} required disabled={saving} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Servicio
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <div className='lg:col-span-2'>
                <Card>
                    <CardHeader>
                        <CardTitle>Mi Catálogo de Servicios</CardTitle>
                        <CardDescription>Todos los servicios que ofreces.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servicio</TableHead>
                                    <TableHead className="hidden md:table-cell">Descripción</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myServices.length > 0 ? myServices.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">{service.description}</TableCell>
                                        <TableCell className="text-right">{service.price}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(service)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteService(service.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Sí, eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No hay servicios para mostrar.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
    
    const renderClientView = () => (
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
                                    <Table>
                                        <TableHeader><TableRow>
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead>Servicio</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Precio</TableHead>
                                        </TableRow></TableHeader>
                                        <TableBody>
                                            {provider.services?.map(service => (
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
                                                    <TableCell className="text-right">{service.price}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex justify-end pt-4">
                                        <Button 
                                            onClick={() => handleCreateCase(provider.providerId, provider.name || 'Proveedor', false)}
                                            disabled={creatingCase || !(selectedServices[provider.providerId] && selectedServices[provider.providerId].length > 0)}
                                        >
                                            {creatingCase && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Solicitar Servicios Seleccionados
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No hay servicios disponibles en tu red.</p>
                        <p className="text-sm mt-1">
                           Para ver servicios, <Link href="/dashboard/network" className="text-primary underline">añade proveedores a tu red</Link> y asegúrate de que tengan servicios publicados.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isProvider ? 'Servicios y Casos' : 'Explorar Servicios'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isProvider 
                            ? 'Gestiona tus servicios y crea nuevos casos para tus clientes.'
                            : 'Explora y solicita servicios de los proveedores en tu red.'
                        }
                    </p>
                </div>
            </div>

            {isProvider ? renderProviderView() : renderClientView()}
            
             {editingService && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Servicio</DialogTitle>
                            <DialogDescription>Realiza los cambios necesarios para actualizar.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateService}>
                             <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Nombre del Servicio</Label>
                                    <Input id="edit-name" name="name" value={editingService.name} onChange={handleEditInputChange} required disabled={saving} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Descripción</Label>
                                    <Textarea id="edit-description" name="description" value={editingService.description} onChange={handleEditInputChange} disabled={saving} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-price">Precio / Tarifa</Label>
                                    <Input id="edit-price" name="price" value={editingService.price} onChange={handleEditInputChange} required disabled={saving} />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Cambios
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </main>
    );
}

    