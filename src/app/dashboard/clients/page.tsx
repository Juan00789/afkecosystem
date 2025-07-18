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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, PlusCircle, UserPlus, Users, Loader2, Link2Off, Star, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// CLIENTS TAB
interface Client {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    avatar: string;
    userId: string;
}

const ClientsTab = ({ user }: { user: User | null }) => {
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const clientsQuery = query(collection(db, 'clients'), where('userId', '==', user.uid));
        
        const unsubscribe = onSnapshot(clientsQuery, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
            setClients(clientsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching clients: ", error);
            toast({
                variant: 'destructive',
                title: 'Error al cargar clientes',
                description: 'No se pudieron obtener los datos. Revisa tu conexión.'
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewClient(prev => ({...prev, [name]: value}));
    }

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'No estás autenticado' });
            return;
        }
        setSaving(true);
        try {
            await addDoc(collection(db, 'clients'), {
                ...newClient,
                userId: user.uid, 
                avatar: `https://placehold.co/100x100.png`,
                createdAt: new Date(),
            });

            toast({ title: 'Cliente guardado' });
            setNewClient({ name: '', company: '', email: '', phone: '' }); 
        } catch (error) {
            console.error('Error al añadir cliente:', error);
            toast({ variant: 'destructive', title: 'Error al guardar' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <UserPlus className="h-6 w-6 text-primary"/>
                            <CardTitle>Añadir Nuevo Cliente</CardTitle>
                        </div>
                        <CardDescription>
                            Rellena el formulario para registrar un nuevo cliente.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAddClient}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input id="name" name="name" placeholder="Ej: Elena Ríos" value={newClient.name} onChange={handleInputChange} required disabled={saving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Empresa (Opcional)</Label>
                                <Input id="company" name="company" placeholder="Ej: Innovaciones Digitales" value={newClient.company} onChange={handleInputChange} disabled={saving} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input id="email" name="email" type="email" placeholder="ejemplo@correo.com" value={newClient.email} onChange={handleInputChange} required disabled={saving} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono (Opcional)</Label>
                                <Input id="phone" name="phone" type="tel" placeholder="Ej: +34 655 123 456" value={newClient.phone} onChange={handleInputChange} disabled={saving}/>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cliente
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <Users className="h-6 w-6 text-primary"/>
                            <CardTitle>Mis Clientes</CardTitle>
                        </div>
                        <CardDescription>
                            Listado de todos tus clientes registrados.
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
                                    <TableHead>Cliente</TableHead>
                                    <TableHead className="hidden md:table-cell">Empresa</TableHead>
                                    <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.length > 0 ? clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={client.avatar} alt={client.name} data-ai-hint="company logo" />
                                                    <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{client.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{client.company}</TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="flex flex-col">
                                                <span>{client.email}</span>
                                                <span className="text-xs text-muted-foreground">{client.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No tienes clientes registrados todavía.
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
    );
};


// PROVIDERS TAB
interface Provider {
    id: string;
    providerId: string;
    name?: string;
    avatar?: string;
    fallback?: string;
    status: 'main' | 'potential';
}

const ProvidersTab = ({ user }: { user: User | null }) => {
    const { toast } = useToast();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [newProviderId, setNewProviderId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
    
        setLoading(true);
        const providersQuery = query(
            collection(db, 'users', user.uid, 'providers'),
            where('userId', '==', user.uid)
        );
    
        const unsubscribe = onSnapshot(providersQuery, async (snapshot) => {
            const providersData: Provider[] = await Promise.all(
                snapshot.docs.map(async (providerDoc) => {
                    const data = providerDoc.data();
                    const userDoc = await getDoc(doc(db, 'users', data.providerId));
                    const userData = userDoc.data();
                    return {
                        id: providerDoc.id,
                        providerId: data.providerId,
                        status: data.status,
                        name: userData?.name || 'Proveedor Desconocido',
                        avatar: userData?.photoURL || 'https://placehold.co/100x100.png',
                        fallback: (userData?.name || 'P').charAt(0).toUpperCase(),
                    };
                })
            );
            setProviders(providersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching providers: ", error);
            toast({
                variant: 'destructive',
                title: 'Error al cargar proveedores',
                description: 'No se pudieron obtener los datos. Revisa tu conexión.'
            });
            setLoading(false);
        });
    
        return () => unsubscribe();
    }, [user, toast]);

    const handleAddProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newProviderId.trim()) return;

        // Prevent adding self
        if (newProviderId.trim() === user.uid) {
            toast({ variant: 'destructive', title: 'No puedes añadirte a ti mismo' });
            return;
        }

        // Prevent adding duplicates
        if (providers.some(p => p.providerId === newProviderId.trim())) {
             toast({ variant: 'destructive', title: 'Este proveedor ya está en tu red' });
            return;
        }

        setSaving(true);
        try {
            const providerRef = doc(db, 'users', newProviderId.trim());
            const providerSnap = await getDoc(providerRef);

            if (!providerSnap.exists()) {
                 toast({ variant: 'destructive', title: 'Proveedor no encontrado', description: 'El ID ingresado no corresponde a ningún usuario.' });
                 setSaving(false);
                 return;
            }

            await addDoc(collection(db, 'users', user.uid, 'providers'), {
                userId: user.uid,
                providerId: newProviderId.trim(),
                status: 'potential',
                createdAt: new Date(),
            });

            toast({ title: 'Proveedor añadido a tu red' });
            setNewProviderId('');
        } catch (error) {
            console.error('Error al añadir proveedor:', error);
            toast({ variant: 'destructive', title: 'Error al añadir proveedor' });
        } finally {
            setSaving(false);
        }
    };

    const handleSetMainProvider = async (providerIdToSet: string) => {
        if (!user) return;
        setSaving(true);
        try {
            const batch = writeBatch(db);
            
            // Set the new main provider
            const newMainRef = doc(db, 'users', user.uid, 'providers', providerIdToSet);
            batch.update(newMainRef, { status: 'main' });

            // Unset any other main provider
            providers.forEach(p => {
                if (p.id !== providerIdToSet && p.status === 'main') {
                    const oldMainRef = doc(db, 'users', user.uid, 'providers', p.id);
                    batch.update(oldMainRef, { status: 'potential' });
                }
            });

            await batch.commit();
            toast({ title: 'Proveedor principal actualizado' });
        } catch (error) {
            console.error('Error al actualizar proveedor principal:', error);
            toast({ variant: 'destructive', title: 'Error al actualizar' });
        } finally {
            setSaving(false);
        }
    };
    
    const handleDeleteProvider = async (docId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'providers', docId));
            toast({ title: 'Proveedor eliminado de tu red' });
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            toast({ variant: 'destructive', title: 'Error al eliminar' });
        }
    }


    return (
         <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <UserPlus className="h-6 w-6 text-primary"/>
                            <CardTitle>Añadir Proveedor a tu Red</CardTitle>
                        </div>
                        <CardDescription>
                            Pega el ID de un proveedor para añadirlo a tus contactos.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAddProvider}>
                        <CardContent className="space-y-2">
                            <Label htmlFor="providerId">ID del Proveedor</Label>
                            <Input 
                                id="providerId" 
                                placeholder="Pega el ID del usuario aquí" 
                                value={newProviderId} 
                                onChange={(e) => setNewProviderId(e.target.value)} 
                                disabled={saving}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={saving || !newProviderId.trim()}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Añadir a la Red
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Users className="h-6 w-6 text-primary"/>
                            <CardTitle>Mis Proveedores</CardTitle>
                        </div>
                        <CardDescription>
                            Gestiona los proveedores en tu red. Elige uno como principal para ver sus servicios.
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
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {providers.length > 0 ? providers.map((provider) => (
                                    <TableRow key={provider.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={provider.avatar} alt={provider.name} data-ai-hint="person face" />
                                                    <AvatarFallback>{provider.fallback}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{provider.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {provider.status === 'main' && <span className="text-primary font-semibold flex items-center gap-1"><Star className="h-4 w-4 fill-primary" /> Principal</span>}
                                            {provider.status === 'potential' && 'Potencial'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {provider.status === 'potential' && (
                                                <Button variant="outline" size="sm" onClick={() => handleSetMainProvider(provider.id)} disabled={saving}>
                                                    Hacer Principal
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProvider(provider.id)} disabled={saving}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No tienes proveedores en tu red.
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
    );
};


// MAIN PAGE COMPONENT
interface UserData {
    name?: string;
    activeRole?: 'provider' | 'client';
}

export default function NetworkPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);

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

    if (!user || !userData) {
         return (
             <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </main>
         )
    }
    
    const isProvider = userData.activeRole === 'provider';

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gestión de tu Red</h2>
                <p className="text-muted-foreground">Añade, visualiza y gestiona tus clientes y proveedores.</p>
            </div>
        </div>

        {isProvider ? (
            <ClientsTab user={user} />
        ) : (
            <ProvidersTab user={user} />
        )}
    </main>
  );
}
