
'use client';

import { useState } from 'react';
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
import { MoreHorizontal, PlusCircle, UserPlus, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const initialClients = [
    {
        id: 'CLI-001',
        name: 'Elena Ríos',
        company: 'Innovaciones Digitales S.L.',
        email: 'elena.rios@innovadigital.es',
        phone: '+34 655 123 456',
        avatar: 'https://placehold.co/100x100.png'
    },
    {
        id: 'CLI-002',
        name: 'Marcos Soler',
        company: 'Soler Asesores',
        email: 'marcos@solerasesores.com',
        phone: '+34 677 789 012',
        avatar: 'https://placehold.co/100x100.png'
    },
    {
        id: 'CLI-003',
        name: 'Beatriz Navarro',
        company: 'Construcciones B.N.',
        email: 'beatriz.navarro@construccionesbn.com',
        phone: '+34 699 345 678',
        avatar: 'https://placehold.co/100x100.png'
    }
]

export default function ClientsPage() {

    const [clients, setClients] = useState(initialClients);
    const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewClient(prev => ({...prev, [name]: value}));
    }

    const handleAddClient = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí iría la lógica para guardar en Firestore
        console.log('Nuevo cliente a añadir:', newClient);
        // Por ahora, solo lo añadimos al estado local como ejemplo
        const clientToAdd = {
            id: `CLI-00${clients.length + 1}`,
            ...newClient,
            avatar: `https://placehold.co/100x100.png`
        };
        setClients(prev => [...prev, clientToAdd]);
        setNewClient({ name: '', company: '', email: '', phone: '' }); // Reset form
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
                                <Input id="name" name="name" placeholder="Ej: Elena Ríos" value={newClient.name} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Empresa (Opcional)</Label>
                                <Input id="company" name="company" placeholder="Ej: Innovaciones Digitales" value={newClient.company} onChange={handleInputChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input id="email" name="email" type="email" placeholder="ejemplo@correo.com" value={newClient.email} onChange={handleInputChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono (Opcional)</Label>
                                <Input id="phone" name="phone" type="tel" placeholder="Ej: +34 655 123 456" value={newClient.phone} onChange={handleInputChange}/>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">
                                <PlusCircle className="mr-2 h-4 w-4" />
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
                                {clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={client.avatar} alt={client.name} data-ai-hint="person face" />
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
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    </main>
  );
}
