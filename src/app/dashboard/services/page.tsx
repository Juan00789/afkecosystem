
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, PlusCircle, Loader2, Edit, Trash2, DollarSign } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface Service {
    id: string;
    name: string;
    description: string;
    price: string;
    currency: 'DOP' | 'USD';
    userId: string;
}

export default function ServicesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [myServices, setMyServices] = useState<Service[]>([]);
    const [newService, setNewService] = useState({ name: '', description: '', price: '', currency: 'DOP' as 'DOP' | 'USD' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
      const auth = getFirebaseAuth();
      const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
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

        const servicesQuery = query(collection(db, 'services'), where('userId', '==', user.uid));
        const unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
            setMyServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching services:", error);
            toast({ variant: 'destructive', title: 'Error al cargar servicios' });
            setLoading(false);
        });
        
        return () => unsubscribeServices();

    }, [user, toast]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewService(prev => ({...prev, [name]: value}));
    };
    
    const handleCurrencyChange = (value: 'DOP' | 'USD') => {
        setNewService(prev => ({ ...prev, currency: value }));
    };
    
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editingService) return;
        const { name, value } = e.target;
        setEditingService(prev => ({...prev!, [name]: value}));
    };
    
    const handleEditCurrencyChange = (value: 'DOP' | 'USD') => {
        if (!editingService) return;
        setEditingService(prev => ({ ...prev!, currency: value }));
    };

    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'services'), {
                ...newService,
                userId: user.uid, 
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Servicio guardado' });
            setNewService({ name: '', description: '', price: '', currency: 'DOP' }); 
        } catch (error) {
            console.error('Error al añadir servicio:', error);
            toast({ variant: 'destructive', title: 'Error al guardar', description: 'Revisa las reglas de seguridad de Firestore.' });
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
                currency: editingService.currency,
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
                        Gestión de Servicios
                    </h2>
                    <p className="text-muted-foreground">
                        Gestiona tu catálogo de servicios. Cualquiera puede ofrecer un servicio.
                    </p>
                </div>
                 <Button onClick={() => document.getElementById('add-service-card')?.scrollIntoView({ behavior: 'smooth' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Nuevo Servicio
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
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
                                            <TableCell className="text-right">{service.price} {service.currency}</TableCell>
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
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">No has añadido ningún servicio todavía.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-1">
                    <Card id="add-service-card">
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
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="price">Precio</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input id="price" name="price" type="number" value={newService.price} onChange={handleInputChange} required disabled={saving} className="pl-8"/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Moneda</Label>
                                        <Select name="currency" value={newService.currency} onValueChange={handleCurrencyChange} required disabled={saving}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DOP">DOP</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
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
            </div>
            
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
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="edit-price">Precio</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input id="edit-price" name="price" type="number" value={editingService.price} onChange={handleEditInputChange} required disabled={saving} className="pl-8"/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-currency">Moneda</Label>
                                        <Select name="currency" value={editingService.currency} onValueChange={handleEditCurrencyChange} required disabled={saving}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DOP">DOP</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
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
