// src/app/dashboard/cases/create/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, documentId } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Suspense } from 'react';


const caseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  providerId: z.string().min(1, 'You must select a collaborator'),
});

type CaseFormData = z.infer<typeof caseSchema>;

interface Provider {
  id: string;
  displayName: string;
}

function CreateCaseFormComponent() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  
  const preselectedProviderId = searchParams.get('providerId');
  const serviceName = searchParams.get('serviceName');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: serviceName || '',
      description: '',
      providerId: preselectedProviderId || '',
    },
  });
  

  useEffect(() => {
    const fetchProviders = async () => {
      if (!user) return;
      
      let providersList: Provider[] = [];

      // Fetch providers from user's network connections
      const clientConnectionsQuery = query(collection(db, 'network_connections'), where('provider_id', '==', user.uid));
      const providerConnectionsQuery = query(collection(db, 'network_connections'), where('client_id', '==', user.uid));
      
      const [clientSnapshot, providerSnapshot] = await Promise.all([
        getDocs(clientConnectionsQuery),
        getDocs(providerConnectionsQuery),
      ]);
      
      const clientIds = clientSnapshot.docs.map(doc => doc.data().client_id);
      const providerIds = providerSnapshot.docs.map(doc => doc.data().provider_id);
      
      const userIds = [...new Set([...clientIds, ...providerIds])];
      
      if (userIds.length > 0) {
          const providersQuery = query(collection(db, 'users'), where('uid', 'in', userIds));
          const providersSnapshot = await getDocs(providersQuery);
          const networkProviders = providersSnapshot.docs.map(doc => ({
              id: doc.id,
              displayName: doc.data().displayName || doc.data().email || 'Unnamed Provider',
          }));
          providersList.push(...networkProviders);
      }

      // Add self as a provider option
      if(userProfile) {
          providersList.push({
            id: user.uid,
            displayName: `${userProfile.displayName || user.email} (Yo mismo)`,
          });
      }

      // Ensure the preselected provider is in the list if they aren't already
      if (preselectedProviderId && !providersList.some(p => p.id === preselectedProviderId)) {
        const providerDoc = await getDoc(doc(db, 'users', preselectedProviderId));
        if (providerDoc.exists()) {
            providersList.push({
                id: providerDoc.id,
                displayName: providerDoc.data().displayName || providerDoc.data().email || 'Unnamed Provider',
            });
        }
      }

      setProviders(providersList);
    };
    fetchProviders();
  }, [user, userProfile, preselectedProviderId]);
  
  useEffect(() => {
    if (preselectedProviderId) {
      setValue('providerId', preselectedProviderId);
    }
     if (serviceName) {
      setValue('title', `Solicitud de servicio: ${serviceName}`);
    }
  }, [preselectedProviderId, serviceName, setValue]);
  

  const onSubmit = async (data: CaseFormData) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to create a case.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'cases'), {
        ...data,
        clientId: user.uid,
        status: 'new',
        createdAt: serverTimestamp(),
        lastUpdate: serverTimestamp(),
      });
      toast({ title: 'Success!', description: 'Your new case has been created.' });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating case: ', error);
      toast({ title: 'Error', description: 'There was a problem creating your case.', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Crear un Nuevo Caso</CardTitle>
        <CardDescription>
          Describe tu proyecto o problema y selecciona un colaborador (o a ti mismo) para manejarlo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título / Nombre del Servicio</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input id="title" placeholder="Ej: Rediseño de logo para..." {...field} />}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label htmlFor="description">Descripción</Label>
            </div>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="description"
                  placeholder="Provee una descripción detallada de lo que necesitas."
                  className="min-h-[150px]"
                  {...field}
                />
              )}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="providerId">Colaborador Asignado</Label>
            <Controller
              name="providerId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <SelectTrigger id="providerId">
                    <SelectValue placeholder="Selecciona un colaborador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.length > 0 ? (
                      providers.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.displayName}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">Cargando tu red...</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.providerId && <p className="text-sm text-destructive">{errors.providerId.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Caso'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Wrap the component in Suspense to use useSearchParams
export function CreateCaseForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateCaseFormComponent />
        </Suspense>
    );
}
