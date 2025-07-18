
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

interface Provider {
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
    const [services, setServices] = useState<Service[]>([]);

    // For Client role
    const [providersWithServices, setProvidersWithServices] = useState<Provider[]>([]);
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
    
    // Combined data fetching effect
    useEffect(() => {
        if (!user || !userData) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // --- PROVIDER LOGIC ---
        if (userData.activeRole === 'provider') {
            const servicesQuery = query(collection(db, 'services'), where('userId', '==', user.uid));
            const unsubscribe = onSnapshot(servicesQuery, (snapshot) => {
                const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
                setServices(servicesData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching services: ", error);
                toast({ variant: 'destructive', title: 'Error al cargar servicios' });
                setLoading(false);
            });
            return () => unsubscribe();
        }

        // --- CLIENT LOGIC ---
        if (userData.activeRole === 'client') {
            const fetchProvidersAndServices = async () => {
                try {
                    // 1. Get all provider connections for the current user
                    const providersQuery = query(collection(db, 'users', user.uid, 'providers'));
                    const providersSnapshot = await getDocs(providersQuery);
                    const providerConnections = providersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as { id: string, providerId: string }));
                    const providerIds = providerConnections.map(p => p.providerId);

                    if (providerIds.length === 0) {
                        setProvidersWithServices([]);
                        setLoading(false);
                        return;
                    }

                    // 2. Fetch user data for all providers in one go
                    const usersQuery = query(collection(db, 'users'), where('__name__', 'in', providerIds));
                    const usersSnapshot = await getDocs(usersQuery);
                    const providersDataMap = new Map<string, any>();
                    usersSnapshot.forEach(doc => providersDataMap.set(doc.id, doc.data()));

                    // 3. Fetch all services from these providers in one query
                    const servicesQuery = query(collection(db, 'services'), where('userId', 'in', providerIds));
                    const servicesSnapshot = await getDocs(servicesQuery);
                    const allServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
                    
                    // 4. Group services by provider and filter providers with no services
                    const groupedProviders: Provider[] = providerConnections
                        .map(connection => {
                            const providerUser = providersDataMap.get(connection.providerId);
                            const providerServices = allServices.filter(s => s.userId === connection.providerId);
                            
                            if (!providerUser || providerServices.length === 0) {
                                return null;
                            }

                            return {
                                id: connection.id,
                                providerId: connection.providerId,
                                name: providerUser?.name || 'Proveedor Desconocido',
                                avatar: providerUser?.photoURL || `https://placehold.co/100x100.png`,
                                fallback: (providerUser?.name || 'P').charAt(0).toUpperCase(),
                                services: providerServices,
                            };
                        })
                        .filter((p): p is Provider => p !== null);

                    setProvidersWithServices(groupedProviders);

                } catch (error) {
                    console.error("Error fetching providers and services: ", error);
                    toast({ variant: 'destructive', title: 'Error al cargar proveedores' });
                } finally {
                    setLoading(false);
                }
            };
            
            fetchProvidersAndServices();
        }

    }, [user, userData, toast]);


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
        if (!user) {
            toast({ variant: 'destructive', title: 'No estás autenticado' });
            return;
        }
        setSaving(true);
        try {
            await addDoc(collection(db, 'services'), {
                ...newService,
                userId: user.uid, 
                createdAt: new Date(),
            });
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
    
    const handleServiceSelection = (providerId: string, serviceId: string, isChecked: boolean) => {
        setSelectedServices(prev => {
            const currentSelection = prev[providerId] || [];
            if (isChecked) {
                return { ...prev, [providerId]: [...currentSelection, serviceId] };
            } else {
                return { ...prev, [providerId]: currentSelection.filter(id => id !== serviceId) };
            }
        });
    };

    const handleCreateCase = async (provider: Provider) => {
        if (!user || !userData) return;
        const servicesToRequest = selectedServices[provider.providerId] || [];
        if (servicesToRequest.length === 0) return;

        setCreatingCase(true);
        try {
            const selectedServiceDetails = provider.services?.filter(s => servicesToRequest.includes(s.id));
            
            const newCaseRef = await addDoc(collection(db, 'cases'), {
                clientId: user.uid,
                clientName: userData.name || 'Cliente sin nombre',
                providerId: provider.providerId,
                providerName: provider.name || 'Proveedor sin nombre',
                services: selectedServiceDetails,
                status: 'Pendiente',
                createdAt: Timestamp.now(),
                lastUpdate: Timestamp.now(),
            });

            toast({
                title: 'Solicitud enviada',
                description: `Se ha creado un nuevo caso con ${provider.name}.`,
            });
            setSelectedServices(prev => ({ ...prev, [provider.providerId]: [] })); // Clear selection for this provider
            router.push(`/dashboard/cases/${newCaseRef.id}`);

        } catch (error) {
            console.error('Error creating case: ', error);
            toast({ variant: 'destructive', title: 'Error al crear el caso' });
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

    // PROVIDER VIEW
    const renderProviderView = () => (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <PlusCircle className="h-6 w-6 text-primary"/>
                            <CardTitle>Añadir Nuevo Servicio</CardTitle>
                        </div>
                        <CardDescription>
                            Define un nuevo servicio para tu catálogo.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAddService}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Servicio</Label>
                                <Input id="name" name="name" placeholder="Ej: Consultoría SEO" value={newService.name} onChange={handleInputChange} required disabled={saving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción (Opcional)</Label>
                                <Textarea id="description" name="description" placeholder="Describe en qué consiste el servicio." value={newService.description} onChange={handleInputChange} disabled={saving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Precio / Tarifa</Label>
                                <Input id="price" name="price" placeholder="Ej: $50/hora o $500 (fijo)" value={newService.price} onChange={handleInputChange} required disabled={saving} />
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
                        <div className="flex items-center gap-3">
                            <ListTodo className="h-6 w-6 text-primary"/>
                            <CardTitle>Mis Servicios</CardTitle>
                        </div>
                        <CardDescription>
                            Listado de todos tus servicios registrados.
                        </CardDescription>
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
                                {services.length > 0 ? services.map((service) => (
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
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                    <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio.
                                                        </AlertDialogDescription>
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
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No hay servicios para mostrar.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
    
    // CLIENT VIEW
    const renderClientView = () => (
         <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Search className="h-6 w-6 text-primary"/>
                    <CardTitle>Catálogo de Servicios de tu Red</CardTitle>
                </div>
                <CardDescription>
                    Explora y selecciona los servicios que necesitas de tus proveedores.
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
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead>Servicio</TableHead>
                                                <TableHead>Descripción</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                            </TableRow>
                                        </TableHeader>
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
                                            onClick={() => handleCreateCase(provider)}
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
                        {isProvider ? 'Gestión de Servicios' : 'Explorar Servicios'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isProvider 
                            ? 'Añade y administra los servicios que ofreces a tus clientes.'
                            : 'Explora los servicios ofrecidos por los proveedores en tu red.'
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
                            <DialogDescription>
                                Realiza los cambios necesarios y guarda para actualizar el servicio.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateService}>
                             <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Nombre del Servicio</Label>
                                    <Input id="edit-name" name="name" value={editingService.name} onChange={handleEditInputChange} required disabled={saving} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Descripción (Opcional)</Label>
                                    <Textarea id="edit-description" name="description" value={editingService.description} onChange={handleEditInputChange} disabled={saving} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-price">Precio / Tarifa</Label>
                                    <Input id="edit-price" name="price" value={editingService.price} onChange={handleEditInputChange} required disabled={saving} />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancelar</Button>
                                </DialogClose>
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
