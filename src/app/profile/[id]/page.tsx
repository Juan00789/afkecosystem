// src/app/profile/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/modules/auth/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Mail, Globe, Phone, UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface ProfilePageParams {
  params: {
    id: string;
  };
}

export default function PublicProfilePage({ params }: ProfilePageParams) {
  const { id } = params;
  const { user: currentUser, userProfile: currentUserProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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

        setProfile(userDocSnap.data() as UserProfile);

        // Check connection status
        if (currentUserProfile?.network?.providers?.includes(id)) {
            setIsConnected(true);
        }

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
  }, [id, currentUserProfile]);

  const handleAddToNetwork = async () => {
    if (!currentUser || !profile) return;
    setIsConnecting(true);
    
    try {
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const otherUserRef = doc(db, 'users', profile.uid);

        // Add provider to current user's network
        await updateDoc(currentUserRef, {
            'network.providers': arrayUnion(profile.uid)
        });

        // Add current user to provider's client list
        await updateDoc(otherUserRef, {
            'network.clients': arrayUnion(currentUser.uid)
        });

        toast({
            title: "Success!",
            description: `${profile.displayName} has been added to your providers.`,
        });
        setIsConnected(true);
    } catch (err) {
        console.error("Error adding to network:", err);
        toast({
            title: "Error",
            description: "Failed to add user to your network.",
            variant: "destructive",
        });
    } finally {
        setIsConnecting(false);
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
                    {profile.displayName ? profile.displayName[0] : 'U'}
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
                         <Button onClick={handleAddToNetwork} disabled={isConnecting || isConnected}>
                            {isConnected ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" /> Ya en tu red
                                </>
                            ) : (
                                 <>
                                    <UserPlus className="mr-2 h-4 w-4" /> 
                                    {isConnecting ? 'Adding...' : 'Añadir a Proveedores'}
                                 </>
                            )}
                        </Button>
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
                           <div className="space-y-4">
                               {services.map(service => (
                                   <div key={service.id} className="flex flex-col sm:flex-row justify-between sm:items-center rounded-lg border p-4">
                                        <div>
                                            <h4 className="font-semibold">{service.name}</h4>
                                            <p className="text-sm text-muted-foreground">{service.description}</p>
                                        </div>
                                        <Badge className="mt-2 sm:mt-0" variant="secondary">${service.price.toFixed(2)}</Badge>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <p className="text-center text-muted-foreground">No services listed.</p>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
     </div>
  );
}
