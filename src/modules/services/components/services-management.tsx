// src/modules/services/components/services-management.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
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


const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters'),
  description: z.string().min(10, 'Description is too short'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface Service extends ServiceFormData {
  id: string;
}

export function ServicesManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', description: '', price: 0 },
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'services'), where('providerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(servicesList);
    });
    return () => unsubscribe();
  }, [user]);
  
  const handleOpenDialog = (service: Service | null = null) => {
    setEditingService(service);
    if (service) {
      setValue('name', service.name);
      setValue('description', service.description);
      setValue('price', service.price);
    } else {
      reset({ name: '', description: '', price: 0 });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      if (editingService) {
        // Update existing service
        const serviceRef = doc(db, 'services', editingService.id);
        await updateDoc(serviceRef, data);
        toast({ title: 'Success', description: 'Service updated successfully.' });
      } else {
        // Add new service
        await addDoc(collection(db, 'services'), {
          ...data,
          providerId: user.uid,
        });
        toast({ title: 'Success', description: 'New service added.' });
      }
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({ title: 'Error', description: 'Failed to save service.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteDoc(doc(db, 'services', serviceId));
      toast({ title: 'Service Deleted', description: 'The service has been removed.' });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({ title: 'Error', description: 'Failed to delete service.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold">My Services</h1>
        <p className="text-muted-foreground">Manage the services you offer to clients.</p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Your Service Catalog</CardTitle>
                    <CardDescription>
                    Add, edit, or remove the services you offer.
                    </CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                    </Button>
                </DialogTrigger>
            </div>
          </CardHeader>
          <CardContent>
             {services.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service) => (
                        <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.name}</TableCell>
                            <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                            <TableCell>${service.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                       <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the service "{service.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                        Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">You haven't added any services yet.</p>
                </div>
             )}
          </CardContent>
        </Card>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add a New Service'}</DialogTitle>
            <DialogDescription>
              Fill out the details for your service below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Controller name="description" control={control} render={({ field }) => <Textarea id="description" {...field} />} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Controller name="price" control={control} render={({ field }) => <Input id="price" type="number" step="0.01" {...field} />} />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Service'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
