// src/modules/cases/components/create-case-form.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
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
  providerId: z.string().min(1, 'You must select a provider'),
});

type CaseFormData = z.infer<typeof caseSchema>;

interface Provider {
  id: string;
  displayName: string;
}

function CreateCaseFormComponent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const preselectedProviderId = searchParams.get('providerId');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: '',
      description: '',
      providerId: preselectedProviderId || '',
    },
  });

  useEffect(() => {
    const fetchProviders = async () => {
      if (!user) return;
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const providerIds = userData.network?.providers || [];
        
        if (providerIds.length > 0) {
            const providersQuery = query(collection(db, 'users'), where('uid', 'in', providerIds));
            const providersSnapshot = await getDocs(providersQuery);
            const providersList = providersSnapshot.docs.map(doc => ({
                id: doc.id,
                displayName: doc.data().displayName || doc.data().email || 'Unnamed Provider',
            }));
            setProviders(providersList);
        }
      }
    };
    fetchProviders();
  }, [user]);
  
  useEffect(() => {
    if (preselectedProviderId) {
      setValue('providerId', preselectedProviderId);
    }
  }, [preselectedProviderId, setValue]);

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
        <CardTitle>Create a New Case</CardTitle>
        <CardDescription>
          Describe your project or issue and select a provider from your network to handle it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input id="title" placeholder="e.g., Website Redesign Project" {...field} />}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of what you need..."
                  className="min-h-[150px]"
                  {...field}
                />
              )}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="providerId">Provider</Label>
            <Controller
              name="providerId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={preselectedProviderId || ""}>
                  <SelectTrigger id="providerId">
                    <SelectValue placeholder="Select a provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.length > 0 ? (
                      providers.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.displayName}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">No providers in your network. Please add one in the 'Network' tab.</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.providerId && <p className="text-sm text-destructive">{errors.providerId.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Case'}
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
