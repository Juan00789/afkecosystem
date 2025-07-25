// src/app/profile/[id]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, runTransaction, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/modules/auth/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Mail, Globe, Phone, UserPlus, Check, Landmark, Wallet, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { processP2PTransfer } from '@/ai/flows/p2p-transfer-flow';


interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category?: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const { user: currentUser, userProfile: currentUserProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSendingCredits, setIsSendingCredits] = useState(false);
  const [creditsToSend, setCreditsToSend] = useState(0);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  const groupedServices = useMemo(() => {
    return services.reduce((acc, service) => {
      const category = service.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(service);
      return acc;
    }, {} as Record<string, Service[]>);
  }, [services]);

  useEffect(() => {
    if (!id) return;

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userDocRef = doc(db, 'users', id);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setError('User not found.');
          return;
        }

        const userProfileData = userDocSnap.data() as UserProfile;
        setProfile(userProfileData);

        const networkConnectionsQuery = query(collection(db, 'network_connections'), where('client_id', '==', currentUser?.uid), where('provider_id', '==', id));
        const networkConnectionsSnapshot = await getDocs(networkConnectionsQuery);
        setIsConnected(!networkConnectionsSnapshot.empty);

        const servicesQuery = query(collection(db, 'services'), where('providerId', '==', id));
        const servicesSnapshot = await getDocs(servicesQuery);
        const servicesList = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Service[];
        setServices(servicesList);

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id, currentUser]);

  const handleAddToNetwork = async () => {
    if (!currentUser || !profile) return;
    setIsConnecting(true);
    
    try {
        await runTransaction(db, async (transaction) => {
            const currentUserRef = doc(db, 'users', currentUser.uid);
            const otherUserRef = doc(db, 'users', profile.uid);

            const connectionsQuery = query(
              collection(db, 'network_connections'),
              where('client_id', '==', currentUser.uid),
              where('provider_id', '==', profile.uid)
            );
            const connectionSnapshot = await getDocs(connectionsQuery);
            
            if (!connectionSnapshot.empty) {
                toast({ title: 'Already Connected', description: 'This provider is already in your network.'});
                return;
            }

            const newConnectionRef = doc(collection(db, 'network_connections'));
            transaction.set(newConnectionRef, {
                client_id: currentUser.uid,
                provider_id: profile.uid,
                created_at: serverTimestamp(),
            });

            // Check if it's the first provider for the current user
            const providersQuery = query(collection(db, 'network_connections'), where('client_id', '==', currentUser.uid));
            const providersSnapshot = await getDocs(providersQuery);
            if (providersSnapshot.docs.length === 0) { // This check is slightly flawed due to transaction, better to check on user's profile array length
                 transaction.update(currentUserRef, { credits: increment(5) });
                 toast({ title: '¡Créditos Ganados!', description: 'Has ganado 5 créditos por añadir tu primer proveedor.' });
            }
        });

        toast({
            title: "¡Éxito!",
            description: `${profile.displayName} ha sido añadido a tus proveedores.`,
        });
        setIsConnected(true);
        await refreshUserProfile();

    } catch (err: any) {
        console.error("Error adding to network:", err);
        toast({
            title: "Error",
            description: err.message || "Failed to add user to your network.",
            variant: "destructive",
        });
    } finally {
        setIsConnecting(false);
    }
  };

  const handleSendCredits = async () => {
      if (!currentUser || !profile || creditsToSend <= 0) return;

      if ((currentUserProfile?.credits || 0) < creditsToSend) {
        toast({ title: 'Fondos Insuficientes', description: 'No tienes suficientes créditos para esta transferencia.', variant: 'destructive'});
        return;
      }
      setIsSendingCredits(true);
      try {
        const result = await processP2PTransfer({
            senderUid: currentUser.uid,
            recipientUid: profile.uid,
            amount: creditsToSend
        });

        if (result.success) {
            toast({ title: 'Transferencia Exitosa', description: result.message });
            await refreshUserProfile(); // Refresh sender's balance
            setIsTransferDialogOpen(false);
            setCreditsToSend(0);
        } else {
            toast({ title: 'Error en la Transferencia', description: result.message, variant: 'destructive' });
        }
      } catch (error: any) {
         toast({ title: 'Error', description: error.message || 'No se pudo completar la transferencia.', variant: 'destructive' });
      } finally {
        setIsSendingCredits(false);
      }
  };


  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading profile...</div>;
  }

  if (error) {
    return <div className="flex h-screen items-center justify-center text-destructive">{error}</div>;
  }

  if (!profile) {
    return null;
  }
  
  const isOwnProfile = currentUser?.uid === profile.uid;

  return (
     <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-col items-center text-center sm:flex-row sm:items-end sm:text-left">
             <Avatar className="h-32 w-32 border-4 border-primary">
                <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                <AvatarFallback className="text-4xl">
                    {profile.displayName ? profile.displayName.charAt(0) : 'U'}
                </AvatarFallback>
            </Avatar>
            <div className="mt-4 sm:ml-6">
                <h1 className="text-4xl font-bold">{profile.displayName}</h1>
                {profile.companyName && (
                    <p className="flex items-center justify-center sm:justify-start text-lg text-muted-foreground">
                        <Briefcase className="mr-2 h-5 w-5" />
                        {profile.companyName}
                    </p>
                )}
                 <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                    {!isOwnProfile && currentUser && (
                      <>
                        <Button onClick={handleAddToNetwork} disabled={isConnecting || isConnected}>
                            {isConnected ? (<><Check className="mr-2 h-4 w-4" /> Ya en tu red</>) : (<><UserPlus className="mr-2 h-4 w-4" /> {isConnecting ? 'Añadiendo...' : 'Añadir a Proveedores'}</>)}
                        </Button>
                        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="secondary">
                              <Send className="mr-2 h-4 w-4" /> Enviar Créditos
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Enviar créditos a {profile.displayName}</DialogTitle>
                              <DialogDescription>
                                Tu balance actual: {currentUserProfile?.credits || 0} créditos.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                              <Label htmlFor="credits-amount">Monto a Enviar</Label>
                              <Input 
                                id="credits-amount"
                                type="number"
                                value={creditsToSend}
                                onChange={(e) => setCreditsToSend(Number(e.target.value))}
                                min="1"
                                max={currentUserProfile?.credits || 0}
                              />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                              </DialogClose>
                              <Button onClick={handleSendCredits} disabled={isSendingCredits || creditsToSend <= 0}>
                                {isSendingCredits ? "Enviando..." : "Confirmar Envío"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                    <Button asChild>
                        <Link href={`/dashboard/cases/create?providerId=${id}`}>Create a Case</Link>
                    </Button>
                     <Button asChild variant="outline">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        </header>

        <Separator />

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center">
                            <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
                            <span>{profile.email}</span>
                        </div>
                        {profile.phoneNumber && (
                             <div className="flex items-center">
                                <Phone className="mr-3 h-5 w-5 text-muted-foreground" />
                                <span>{profile.phoneNumber}</span>
                            </div>
                        )}
                        {profile.website && (
                             <div className="flex items-center">
                                <Globe className="mr-3 h-5 w-5 text-muted-foreground" />
                                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {profile.website}
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Services Offered</CardTitle>
                         <CardDescription>
                            Here are the services provided by {profile.displayName}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       {services.length > 0 ? (
                           <div className="space-y-6">
                               {Object.entries(groupedServices).map(([category, serviceList]) => (
                                   <div key={category}>
                                       <h4 className="text-lg font-semibold mb-2 text-primary">{category}</h4>
                                       <div className="space-y-4">
                                           {serviceList.map(service => (
                                               <div key={service.id} className="flex flex-col sm:flex-row justify-between sm:items-center rounded-lg border p-4">
                                                    <div>
                                                        <h5 className="font-semibold">{service.name}</h5>
                                                        <p className="text-sm text-muted-foreground">{service.description}</p>
                                                    </div>
                                                    <Badge className="mt-2 sm:mt-0" variant="secondary">${service.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Badge>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <p className="text-center text-muted-foreground">No services listed.</p>
                       )}
                       {profile.bankInfo && (profile.bankInfo.bankName || profile.bankInfo.accountNumber) && (
                            <>
                                <Separator className="my-6" />
                                <div className="space-y-2">
                                    <h4 className="font-semibold flex items-center">
                                        <Landmark className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Información de Pago
                                    </h4>
                                    <div className="text-sm text-muted-foreground space-y-1 pl-6">
                                        {profile.bankInfo.bankName && <p><strong>Banco:</strong> {profile.bankInfo.bankName}</p>}
                                        {profile.bankInfo.accountNumber && <p><strong>Cuenta:</strong> {profile.bankInfo.accountNumber}</p>}
                                    </div>
                                </div>
                            </>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
     </div>
  );
}
