
// src/app/dashboard/creditos/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, HandCoins, CheckCircle, BookOpen, UserPlus, FileText, Landmark, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const creditRequestSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor que cero.'),
  purpose: z.string().min(20, 'Describe el propósito con más detalle (mínimo 20 caracteres).'),
  repaymentTerm: z.string().min(1, 'Debes seleccionar un plazo.'),
});

type CreditRequestFormData = z.infer<typeof creditRequestSchema>;

interface CreditRequest {
  id: string;
  amount: number;
  purpose: string;
  repaymentTerm: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: { toDate: () => Date };
}

interface Loan {
    id: string;
    amount: number;
    repaymentTerm: string;
    status: 'outstanding' | 'paid';
    dueDate: { toDate: () => Date };
}

const waysToEarn = [
  {
    icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    title: 'Completar un Caso de Apoyo',
    description: 'Gana 10 créditos cada vez que ayudas a resolver una necesidad.',
  },
  {
    icon: <BookOpen className="h-6 w-6 text-blue-500" />,
    title: 'Compartir un Estudio',
    description: 'Gana 25 créditos por cada nuevo recurso que compartas con la comunidad.',
  },
  {
    icon: <UserPlus className="h-6 w-6 text-purple-500" />,
    title: 'Invitar a un Hermano',
    description: 'Gana 5 créditos por cada nuevo miembro que se una a tu red.',
  },
];

export default function CreditosPage() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  
  const { control, handleSubmit, reset } = useForm<CreditRequestFormData>({
    resolver: zodResolver(creditRequestSchema),
    defaultValues: {
      amount: 1000,
      purpose: '',
      repaymentTerm: '30',
    },
  });

  useEffect(() => {
    if (!user) return;
    const qRequests = query(collection(db, 'credit_requests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CreditRequest));
        setCreditRequests(requests);
    });

    const qLoans = query(collection(db, 'loans'), where('userId', '==', user.uid), where('status', '==', 'outstanding'), orderBy('dueDate', 'asc'));
    const unsubscribeLoans = onSnapshot(qLoans, (snapshot) => {
        const userLoans = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Loan));
        setLoans(userLoans);
    });

    return () => {
        unsubscribeRequests();
        unsubscribeLoans();
    };
  }, [user]);

  const onSubmit = async (data: CreditRequestFormData) => {
    if (!user) {
        toast({ title: 'Error', description: 'Debes iniciar sesión.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
        await addDoc(collection(db, 'credit_requests'), {
            userId: user.uid,
            userName: userProfile?.displayName,
            ...data,
            status: 'pending',
            createdAt: serverTimestamp(),
        });
        toast({ title: '¡Éxito!', description: 'Tu solicitud de ayuda ha sido enviada para revisión.' });
        reset();
    } catch (error) {
        console.error('Error submitting credit request:', error);
        toast({ title: 'Error', description: 'No se pudo enviar tu solicitud.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handlePayLoan = async (loanId: string) => {
    // This is a simulated payment for now
    const batch = writeBatch(db);
    const loanRef = doc(db, 'loans', loanId);
    batch.update(loanRef, { status: 'paid' });
    // In a real scenario, you'd also decrease user credits and update fund capital
    await batch.commit();
    toast({ title: 'Pago Registrado', description: 'Gracias por tu generosidad y compromiso.'});
  };

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Panel Principal
          </Link>
        </Button>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
             <Card>
                <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <HandCoins className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight text-primary">
                        Fondo de Ayuda Mutua
                        </CardTitle>
                        <CardDescription className="text-lg">
                        Apoyándonos unos a otros en amor y servicio.
                        </CardDescription>
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">
                    Los créditos son un reflejo de nuestra contribución y confianza. Solicita apoyo del fondo para proyectos de ministerio, necesidades personales o para bendecir a otros. Tu participación activa en la comunidad fortalece este fondo de todos.
                </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Solicitar Ayuda del Fondo</CardTitle>
                    <CardDescription>Completa el formulario para enviar tu solicitud de apoyo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto Solicitado (Créditos)</Label>
                            <Controller name="amount" control={control} render={({ field }) => <Input id="amount" type="number" {...field} />} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="purpose">Propósito de la Ayuda</Label>
                            <Controller name="purpose" control={control} render={({ field }) => <Textarea id="purpose" placeholder="Ej: Materiales para el ministerio de niños..." {...field} />} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="repaymentTerm">Plazo de Devolución (si aplica)</Label>
                            <Controller name="repaymentTerm" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Selecciona un plazo..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 días</SelectItem>
                                        <SelectItem value="60">60 días</SelectItem>
                                        <SelectItem value="90">90 días</SelectItem>
                                        <SelectItem value="0">No aplica (Donación)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle>Mis Compromisos Activos</CardTitle></CardHeader>
                <CardContent>
                    {loans.length > 0 ? (
                        <ul className="space-y-3">
                            {loans.map(loan => (
                                <li key={loan.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{loan.amount.toLocaleString()} créditos</p>
                                        <p className="text-sm text-muted-foreground">Fecha compromiso: {format(loan.dueDate.toDate(), 'PP')}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handlePayLoan(loan.id)}>Registrar Devolución</Button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-muted-foreground text-center py-4">No tienes compromisos pendientes.</p>}
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-2 space-y-8">
             <Card className="text-center sticky top-24">
                <CardHeader>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20 mb-4">
                        <Wallet className="h-10 w-10 text-secondary" />
                    </div>
                    <CardTitle className="text-xl font-bold">Tu Balance de Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <Skeleton className="h-16 w-32 mx-auto" />
                    ) : (
                        <p className="text-6xl font-extrabold text-secondary">
                            {userProfile?.credits || 0}
                        </p>
                    )}
                    <p className="text-muted-foreground mt-2">créditos por servicio</p>

                    <div className="mt-6 text-left">
                        <h4 className="font-semibold mb-2">Historial de Solicitudes</h4>
                         <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                         {creditRequests.length > 0 ? (
                            creditRequests.map(req => (
                                <div key={req.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                                    <div>
                                        <p className="font-medium">{req.amount.toLocaleString()} créditos</p>
                                        <p className="text-xs text-muted-foreground">{format(req.createdAt.toDate(), 'PP')}</p>
                                    </div>
                                    <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                                        {req.status}
                                    </Badge>
                                </div>
                            ))
                         ) : <p className="text-xs text-muted-foreground text-center py-4">No tienes solicitudes.</p>}
                         </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Cómo Ganar Créditos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {waysToEarn.map(way => (
                        <div key={way.title} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">{way.icon}</div>
                            <div>
                                <h3 className="font-semibold text-sm">{way.title}</h3>
                                <p className="text-xs text-muted-foreground">{way.description}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
