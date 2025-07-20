// src/modules/marketplace/components/marketplace.tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/modules/auth/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  providerId: string;
  provider?: UserProfile;
}

export function Marketplace() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServicesAndProviders = async () => {
      setLoading(true);
      try {
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];

        if (servicesData.length > 0) {
          const providerIds = [...new Set(servicesData.map(s => s.providerId))];
          const usersSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', 'in', providerIds)));
          const providersMap = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as UserProfile]));

          const enrichedServices = servicesData.map(service => ({
            ...service,
            provider: providersMap.get(service.providerId),
          }));

          setServices(enrichedServices);
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error("Error fetching marketplace data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServicesAndProviders();
  }, []);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="flex-grow">
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Explora servicios ofrecidos por otros emprendedores en la red.</p>
      </div>

      {loading ? (
        renderSkeleton()
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>${service.price.toFixed(2)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={service.provider?.photoURL} />
                        <AvatarFallback>{service.provider?.displayName?.[0] || 'P'}</AvatarFallback>
                    </Avatar>
                     <Link href={`/profile/${service.providerId}`} className="text-sm font-medium hover:underline">
                        {service.provider?.displayName || 'Ver Proveedor'}
                     </Link>
                </div>
                <Button asChild size="sm">
                  <Link href={`/dashboard/cases/create?providerId=${service.providerId}&serviceName=${encodeURIComponent(service.name)}`}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Solicitar
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">El mercado está tranquilo</h2>
            <p className="text-muted-foreground mt-2">No hay servicios publicados en este momento. ¡Vuelve pronto!</p>
        </div>
      )}
    </div>
  );
}
