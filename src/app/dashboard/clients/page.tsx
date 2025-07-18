
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
import { MoreHorizontal, PlusCircle, UserPlus, Users, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface Client {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    avatar: string;
    userId: string;
}

const initialClient: Client[] = [
    {
        id: '1',
        name: 'Ledpop_Decorspop',
        company: 'Ledpop',
        email: 'ventas@ledpop.com',
        phone: '849-886-5556',
        avatar: `https://placehold.co/100x100.png`,
        userId: 'demo'
    }
]

export default function ClientsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [clients, setClients] = useState<Client[]>(initialClient);
    const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
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
        const clientsCollection = collection(db, 'clients');
        
        const unsubscribe = onSnapshot(clientsCollection, (snapshot) => {
            const clientsData = snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as Client))
              .filter(client => client.userId === user.uid); 
            
            // Combine initial client with fetched clients, avoiding duplicates if demo user exists
            setClients(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const newClients = clientsData.filter(c => !existingIds.has(c.id));
                return [...prev, ...newClients];
            });

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
            toast({
                variant: 'destructive',
                title: 'No estás autenticado',
                description: 'Debes iniciar sesión para añadir clientes.'
            });
            return;
        }
        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, 'clients'), {
                ...newClient,
                userId: user.uid, 
                avatar: `https://placehold.co/100x100.png`,
                createdAt: new Date(),
            });

            // Optimistically update UI
            setClients(prev => [...prev, { id: docRef.id, ...newClient, avatar: `https://placehold.co/100x100.png`, userId: user.uid }]);


            toast({
                title: 'Cliente guardado',
                description: 'El nuevo cliente ha sido añadido a tu lista.',
            });
            setNewClient({ name: '', company: '', email: '', phone: '' }); 
        } catch (error) {
            console.error('Error al añadir cliente:', error);
            toast({
                variant: 'destructive',
                title: 'Error al guardar',
                description: 'No se pudo añadir el cliente. Inténtalo de nuevo.',
            });
        } finally {
            setSaving(false);
        }
    }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h2>
                <p className="text-muted-foreground">Añade, visualiza y gestiona la información de tus clientes.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <UserPlus className="h-6 w-6 text-primary"/>
                            <CardTitle>Añadir Nuevo Cliente</CardTitle>
                        </div>
                        <CardDescription>
                            Rellena el formulario para registrar un nuevo cliente en el sistema.
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
                        {loading && clients.length === 0 ? (
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
    </main>
  );
}
