// src/app/dashboard/contabilidad/transactions/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: 'Please select a transaction type.' }),
  description: z.string().min(3, 'Description must be at least 3 characters.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  category: z.string().min(3, 'Category is required.'),
  date: z.coerce.date({ required_error: 'Please select a date.' }),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Transaction extends TransactionFormData {
  id: string;
  date: { toDate: () => Date };
}

const expenseCategories = ['Marketing', 'Suministros', 'Alquiler', 'Software', 'Salarios', 'Impuestos', 'Otros'];
const incomeCategories = ['Venta de Producto', 'Servicio Prestado', 'Consultoría', 'Otro'];

export default function TransactionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      amount: 0,
      category: '',
      date: new Date(),
    },
  });

  const transactionType = watch('type');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trans);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        ...data,
        userId: user.uid,
        date: data.date,
      });
      toast({ title: 'Éxito', description: 'Transacción añadida.' });
      reset();
    } catch (error) {
      console.error('Error adding transaction: ', error);
      toast({ title: 'Error', description: 'No se pudo añadir la transacción.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'transactions', id));
        toast({ title: 'Éxito', description: 'Transacción eliminada.' });
    } catch (error) {
        console.error('Error deleting transaction: ', error);
        toast({ title: 'Error', description: 'No se pudo eliminar la transacción.', variant: 'destructive' });
    }
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard/contabilidad">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Dashboard
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Añadir Transacción</CardTitle>
                    <CardDescription>Registra tus ingresos y gastos para mantener todo en orden.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                           <Label>Tipo de Transacción</Label>
                           <Controller name="type" control={control} render={({ field }) => (
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                   <SelectTrigger><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                       <SelectItem value="expense">Gasto</SelectItem>
                                       <SelectItem value="income">Ingreso</SelectItem>
                                   </SelectContent>
                               </Select>
                           )} />
                           {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Controller name="description" control={control} render={({ field }) => <Input id="description" {...field} />} />
                            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto (DOP)</Label>
                            <Controller name="amount" control={control} render={({ field }) => <Input id="amount" type="number" {...field} />} />
                            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                             <Controller name="category" control={control} render={({ field }) => (
                               <Select onValueChange={field.onChange} value={field.value}>
                                   <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                                   <SelectContent>
                                       {(transactionType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                                           <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                       ))}
                                   </SelectContent>
                               </Select>
                           )} />
                           {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Controller name="date" control={control} render={({ field }) => <Input id="date" type="date" value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''} onChange={e => field.onChange(new Date(e.target.value))} />} />
                            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? 'Guardando...' : 'Guardar Transacción'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Transacciones</CardTitle>
                    <CardDescription>Todas tus transacciones registradas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Cargando...</TableCell></TableRow>
                            ) : transactions.length > 0 ? (
                                transactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell>{format(t.date.toDate(), 'dd/MM/yy')}</TableCell>
                                    <TableCell className="font-medium">{t.description}</TableCell>
                                    <TableCell>{t.category}</TableCell>
                                    <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                        ${t.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                       <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción no se puede deshacer y eliminará la transacción permanentemente.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(t.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                       </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="text-center">No hay transacciones.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
