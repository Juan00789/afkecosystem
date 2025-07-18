
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
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

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, PlusCircle, ListTodo, Loader2, Search, Edit, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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

interface ProviderConnection {
    id: string;
    providerId: string;
    status: 'potential' | 'main';
}

export default function ServicesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [mainProviderId, setMainProviderId] = useState<string | null>(null);
    const [services, setServices] = useState<Service[]>([]);
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
    
    // Effect to get the main provider for the current user (if client)
    useEffect(() => {
        if (user && userData?.activeRole === 'client') {
            const providersQuery = query(
                collection(db, 'users', user.uid, 'providers'),
                where('status', '==', 'main'),
                where('userId', '==', user.uid) // Security rule compliance
            );
            const unsubscribe = onSnapshot(providersQuery, (snapshot) => {
                if (!snapshot.empty) {
                    const mainProviderDoc = snapshot.docs[0];
                    setMainProviderId(mainProviderDoc.data().providerId);
                } else {
                    setMainProviderId(null);
                }
            });
            return () => unsubscribe();
        }
    }, [user, userData]);


    useEffect(() => {
        if (!user || !userData) {
            setLoading(false);
            return;
        }

        setLoading(true);
        let servicesQuery;

        if (userData.activeRole === 'provider') {
            servicesQuery = query(collection(db, 'services'), where('userId', '==', user.uid));
        } else if (userData.activeRole === 'client' && mainProviderId) {
            servicesQuery = query(collection(db, 'services'), where('userId', '==', mainProviderId));
        } else {
            setServices([]);
            setLoading(false);
            return;
        }
        
        const unsubscribe = onSnapshot(servicesQuery, (snapshot) => {
            const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
            setServices(servicesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching services: ", error);
            toast({
                variant: 'destructive',
                title: 'Error al cargar servicios',
                description: 'No se pudieron obtener los datos. Revisa tu conexión.'
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userData, mainProviderId, toast]);

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

    const isProvider = userData?.activeRole === 'provider';

    if (!userData) {
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
                        {isProvider ? 'Gestión de Servicios' : 'Servicios Disponibles'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isProvider 
                            ? 'Añade y administra los servicios que ofreces a tus clientes.'
                            : 'Explora los servicios ofrecidos por tu proveedor principal.'
                        }
                    </p>
                </div>
            </div>

            <div className={`grid grid-cols-1 gap-8 ${isProvider ? 'lg:grid-cols-3' : ''}`}>
                {isProvider && (
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
                )}
                <div className={isProvider ? 'lg:col-span-2' : 'w-full'}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                {isProvider ? <ListTodo className="h-6 w-6 text-primary"/> : <Search className="h-6 w-6 text-primary"/>}
                                <CardTitle>{isProvider ? 'Mis Servicios' : 'Catálogo de Servicios'}</CardTitle>
                            </div>
                            <CardDescription>
                                {isProvider ? 'Listado de todos tus servicios registrados.' : 'Estos son los servicios que puedes solicitar.'}
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
                                        <TableHead>Servicio</TableHead>
                                        <TableHead className="hidden md:table-cell">Descripción</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        {isProvider && <TableHead className="text-right">Acciones</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.length > 0 ? services.map((service) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-medium">{service.name}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{service.description}</TableCell>
                                            <TableCell className="text-right">{service.price}</TableCell>
                                            {isProvider && (
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
                                            )}
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={isProvider ? 4 : 3} className="h-24 text-center">
                                                {!isProvider && !mainProviderId
                                                    ? (
                                                        <span>
                                                            Para ver servicios, <Link href="/dashboard/network" className="text-primary underline">añade un proveedor principal a tu red</Link>.
                                                        </span>
                                                      )
                                                    : 'No hay servicios para mostrar.'
                                                }
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            
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
