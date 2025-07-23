// src/app/dashboard/contabilidad/transactions/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, getDocs, documentId } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import type { UserProfile } from '@/modules/auth/types';
import type { Transaction } from '@/modules/invoicing/types';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: 'Please select a transaction type.' }),
  description: z.string().min(3, 'Description must be at least 3 characters.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  date: z.coerce.date({ required_error: 'Please select a date.' }),
  category: z.string().min(1, 'Debe seleccionar una categoría.'),
  paymentMethod: z.string().min(1, 'Debe seleccionar un método de pago.'),
  relatedPartyId: z.string().optional(),
  manualRelatedPartyName: z.string().optional(),
  documentFile: z.any().optional(),
}).refine(data => {
    if (data.relatedPartyId === 'manual') {
        return !!data.manualRelatedPartyName && data.manualRelatedPartyName.length > 0;
    }
    return true;
}, {
    message: 'El nombre manual es requerido cuando se selecciona "Otro".',
    path: ['manualRelatedPartyName'],
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface NetworkUser {
    id: string;
    displayName: string;
}

const expenseCategories = ['Suministros', 'Marketing', 'Transporte', 'Alquiler', 'Servicios', 'Impuestos', 'Otros'];
const incomeCategories = ['Venta de Producto', 'Venta de Servicio', 'Consultoría', 'Otro'];
const paymentMethods = ['Efectivo', 'Transferencia Bancaria', 'Tarjeta de Crédito/Débito', 'PayPal', 'Otro'];

export default function TransactionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [networkUsers, setNetworkUsers] = useState<NetworkUser[]>([]);
  const [fileName, setFileName] = useState('');

  const { control, handleSubmit, reset, watch, register, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      amount: 0,
      date: new Date(),
      category: '',
      paymentMethod: '',
      relatedPartyId: '',
      manualRelatedPartyName: '',
    },
  });

  const transactionType = watch('type');
  const relatedPartySelection = watch('relatedPartyId');

  useEffect(() => {
    if (!user) return;

    const fetchNetwork = async () => {
        const clientConnectionsQuery = query(collection(db, 'network_connections'), where('provider_id', '==', user.uid));
        const providerConnectionsQuery = query(collection(db, 'network_connections'), where('client_id', '==', user.uid));
        
        const [clientSnapshot, providerSnapshot] = await Promise.all([
            getDocs(clientConnectionsQuery),
            getDocs(providerConnectionsQuery),
        ]);

        const clientIds = clientSnapshot.docs.map(doc => doc.data().client_id);
        const providerIds = providerSnapshot.docs.map(doc => doc.data().provider_id);
        
        const allIds = [...new Set([...clientIds, ...providerIds])];

        if (allIds.length > 0) {
            const usersQuery = query(collection(db, 'users'), where('uid', 'in', allIds));
            const usersSnapshot = await getDocs(usersQuery);
            const usersList = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                displayName: (doc.data() as UserProfile).displayName || doc.data().email,
            }));
            setNetworkUsers(usersList);
        }
    }
    fetchNetwork();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('status', '==', 'active'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trans);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching transactions: ", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      let relatedPartyName: string | undefined = undefined;
      let relatedPartyId: string | undefined = undefined;
      let documentUrl: string | undefined = undefined;
      
      if (data.type === 'expense' && data.documentFile?.[0]) {
          const file = data.documentFile[0];
          const storageRef = ref(storage, `expense-documents/${user.uid}/${Date.now()}-${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          documentUrl = await getDownloadURL(snapshot.ref);
      }

      if(data.relatedPartyId) {
          if(data.relatedPartyId === 'manual') {
              relatedPartyName = data.manualRelatedPartyName;
          } else {
              const selectedUser = networkUsers.find(u => u.id === data.relatedPartyId);
              relatedPartyName = selectedUser?.displayName;
              relatedPartyId = selectedUser?.id;
          }
      }

      await addDoc(collection(db, 'transactions'), {
        type: data.type,
        description: data.description,
        amount: data.amount,
        date: data.date,
        category: data.category,
        paymentMethod: data.paymentMethod,
        relatedPartyId: relatedPartyId,
        relatedPartyName: relatedPartyName,
        userId: user.uid,
        status: 'active',
        createdAt: serverTimestamp(),
        documentUrl: documentUrl,
      });
      toast({ title: 'Éxito', description: 'Transacción añadida.' });
      reset();
      setFileName('');
    } catch (error) {
      console.error('Error adding transaction: ', error);
      toast({ title: 'Error', description: 'No se pudo añadir la transacción.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
        const transactionRef = doc(db, 'transactions', id);
        await updateDoc(transactionRef, { status: 'archived' });
        toast({ title: 'Transacción Archivada', description: 'La transacción ha sido archivada y se puede ver en el historial.' });
    } catch (error) {
        console.error('Error archiving transaction: ', error);
        toast({ title: 'Error', description: 'No se pudo archivar la transacción.', variant: 'destructive' });
    }
  }

  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="container mx-auto max-w-7xl p-4 space-y-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard/contabilidad">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Dashboard de Finanzas
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
                            <Label htmlFor="description">Descripción / Concepto</Label>
                            <Controller name="description" control={control} render={({ field }) => <Textarea id="description" {...field} />} />
                            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                        </div>
                         <div className="space-y-2">
                           <Label>Cliente / Proveedor (Opcional)</Label>
                           <Controller name="relatedPartyId" control={control} render={({ field }) => (
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                   <SelectTrigger><SelectValue placeholder="Selecciona un contacto..." /></SelectTrigger>
                                   <SelectContent>
                                       {networkUsers.map(nu => <SelectItem key={nu.id} value={nu.id}>{nu.displayName}</SelectItem>)}
                                       <SelectItem value="manual">Otro (Entrada Manual)</SelectItem>
                                   </SelectContent>
                               </Select>
                           )} />
                           {relatedPartySelection === 'manual' && (
                               <div className="space-y-2 pt-2">
                                   <Label htmlFor="manualRelatedPartyName">Nombre del Cliente/Proveedor Manual</Label>
                                   <Controller name="manualRelatedPartyName" control={control} render={({ field }) => <Input id="manualRelatedPartyName" placeholder="Escribe el nombre" {...field} />} />
                                   {errors.manualRelatedPartyName && <p className="text-sm text-destructive">{errors.manualRelatedPartyName.message}</p>}
                               </div>
                           )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto (DOP)</Label>
                            <Controller name="amount" control={control} render={({ field }) => <Input id="amount" type="number" {...field} />} />
                            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Controller name="date" control={control} render={({ field }) => <Input id="date" type="date" value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''} onChange={e => field.onChange(new Date(e.target.value))} />} />
                            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                        </div>
                        <div className="space-y-2">
                           <Label>Categoría</Label>
                           <Controller name="category" control={control} render={({ field }) => (
                               <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                   <SelectTrigger><SelectValue placeholder="Selecciona una categoría..." /></SelectTrigger>
                                   <SelectContent>
                                       {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                   </SelectContent>
                               </Select>
                           )} />
                           {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                        </div>
                        <div className="space-y-2">
                           <Label>Método de Pago</Label>
                           <Controller name="paymentMethod" control={control} render={({ field }) => (
                               <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                   <SelectTrigger><SelectValue placeholder="Selecciona un método..." /></SelectTrigger>
                                   <SelectContent>
                                       {paymentMethods.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}
                                   </SelectContent>
                               </Select>
                           )} />
                           {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
                        </div>
                        
                        {transactionType === 'expense' && (
                            <div className="space-y-2">
                                <Label htmlFor="documentFile">Adjuntar Factura/Recibo (Opcional)</Label>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="document-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">{fileName || 'Sube tu factura'}</p>
                                        </div>
                                        <input id="document-upload" type="file" className="hidden" {...register('documentFile')} onChange={e => setFileName(e.target.files?.[0]?.name || '')}/>
                                    </label>
                                </div>
                            </div>
                        )}

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
                    <CardTitle>Transacciones Activas Recientes</CardTitle>
                    <CardDescription>Movimientos que no han sido archivados.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Concepto</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Fecha</TableHead>
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
                                    <TableCell className="font-medium">{t.description}</TableCell>
                                    <TableCell>{t.category}</TableCell>
                                    <TableCell>{format(t.date.toDate(), 'dd/MM/yy')}</TableCell>
                                    <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                        {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                       <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Archivar transacción?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción marcará la transacción como archivada. Podrás verla en el historial completo.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(t.id)}>Archivar</AlertDialogAction>
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
