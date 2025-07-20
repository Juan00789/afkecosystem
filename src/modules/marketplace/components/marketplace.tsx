// src/modules/marketplace/components/marketplace.tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/modules/auth/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/modules/auth/hooks/use-auth';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  providerId: string;
  provider?: UserProfile;
}

const WhatsAppIcon = () => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-2"
      fill="currentColor"
    >
      <path d="M12.04 2.016c-5.49 0-9.957 4.467-9.957 9.957 0 1.906.538 3.696 1.487 5.25L2.015 22l4.904-1.556a9.88 9.88 0 0 0 4.982 1.32c5.49 0 9.956-4.467 9.956-9.957s-4.466-9.957-9.956-9.957zm0 18.15c-1.636 0-3.23-.42-4.62-1.205l-.33-.195-3.434.91.927-3.356-.214-.348a8.35 8.35 0 0 1-1.26-4.96c0-4.54 3.704-8.244 8.244-8.244s8.244 3.704 8.244 8.244-3.704 8.244-8.244 8.244zm4.512-6.136c-.247-.124-1.463-.722-1.69- .808-.226-.086-.39-.124-.555.124-.164.247-.638.808-.782.972-.144.165-.288.185-.535.062-.247-.124-.927-.34-1.767-1.09s-1.402-1.636-1.402-1.928c0-.29.313-.446.425-.554.112-.108.247-.287.37-.47.124-.184.165-.307.247-.514.082-.206.04-.385-.02-.51-.06-.124-.555-1.33-.76-1.822-.206-.49-.413-.422-.555-.43-.144-.007-.308-.007-.472-.007a.95.95 0 0 0-.68.307c-.226.247-.873.85-1.07 2.06s-.206 2.223.04 2.514c.247.29 1.424 2.223 3.456 3.036 2.032.813 2.032.544 2.398.514.367-.03.928-.38 1.05- .74.124-.36.124-.67.082-.81z" />
    </svg>
);


export function Marketplace() {
  const { user } = useAuth();
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
          const providerIds = [...new Set(servicesData.map(s => s.providerId))].filter(Boolean);
          
          if (providerIds.length === 0) {
            setServices(servicesData); // Set services without providers if no IDs found
            setLoading(false);
            return;
          }

          const usersSnapshot = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', providerIds)));
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
  
  const displayedServices = services.filter(service => service.providerId !== user?.uid);

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Explora servicios ofrecidos por otros emprendedores en la red.</p>
      </div>

      {loading ? (
        renderSkeleton()
      ) : displayedServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map(service => {
            const phoneNumber = service.provider?.phoneNumber?.replace(/\D/g, '');
            const message = encodeURIComponent(`Hola, te contacto desde AFKEcosystem. Estoy interesado/a en tu servicio de '${service.name}'.`);
            
            return (
              <Card key={service.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>${service.price ? service.price.toFixed(2) : '0.00'}</CardDescription>
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
                    {phoneNumber && (
                        <Button asChild size="sm">
                            <a href={`https://wa.me/${phoneNumber}?text=${message}`} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon />
                                Solicitar
                            </a>
                        </Button>
                    )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
         <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">El mercado está tranquilo</h2>
            <p className="text-muted-foreground mt-2">No hay servicios de otros proveedores publicados en este momento. ¡Vuelve pronto!</p>
        </div>
      )}
    </div>
  );
}
