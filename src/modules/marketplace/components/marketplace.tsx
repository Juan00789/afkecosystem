// src/modules/marketplace/components/marketplace.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/modules/auth/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { MessageSquare, Search, LayoutGrid, Megaphone, PencilRuler, Code, Hotel, BookText, BrainCircuit, Wrench, Paintbrush, Flower2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  providerId: string;
  category?: string; // Assuming services might have categories
  provider?: UserProfile;
}

const CATEGORIES = [
    { name: 'Todos', icon: <LayoutGrid className="h-4 w-4 mr-2" /> },
    { name: 'Diseño', icon: <PencilRuler className="h-4 w-4 mr-2" /> },
    { name: 'Marketing', icon: <Megaphone className="h-4 w-4 mr-2" /> },
    { name: 'Tecnología', icon: <Code className="h-4 w-4 mr-2" /> },
    { name: 'Consultoría', icon: <BrainCircuit className="h-4 w-4 mr-2" /> },
    { name: 'Contenido', icon: <BookText className="h-4 w-4 mr-2" /> },
    { name: 'Hotelería', icon: <Hotel className="h-4 w-4 mr-2" /> },
    { name: 'Mantenimientos', icon: <Wrench className="h-4 w-4 mr-2" /> },
    { name: 'Manitas para decoración', icon: <Paintbrush className="h-4 w-4 mr-2" /> },
    { name: 'Floristería', icon: <Flower2 className="h-4 w-4 mr-2" /> },
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  useEffect(() => {
    const fetchServicesAndProviders = async () => {
      setLoading(true);
      try {
        // A better approach for a large app would be a dedicated search service like Algolia
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const servicesData = servicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];

        if (servicesData.length > 0) {
          const providerIds = [...new Set(servicesData.map(s => s.providerId))].filter(Boolean);
          
          if (providerIds.length === 0) {
            setServices(servicesData);
            setLoading(false);
            return;
          }
          
          // Batch fetch providers
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

  const filteredServices = useMemo(() => {
    return services.filter(service => {
        const matchesCategory = selectedCategory === 'Todos' || (service.category && service.category.toLowerCase() === selectedCategory.toLowerCase());
        const matchesSearch = searchTerm === '' || 
                              service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              service.provider?.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });
  }, [services, searchTerm, selectedCategory]);

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
       <header>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Explora servicios ofrecidos por otros emprendedores en la red.</p>
      </header>

      <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Buscar por servicio, descripción o proveedor..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
         <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(category => (
                <Button 
                    key={category.name}
                    variant={selectedCategory === category.name ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.name)}
                    className="flex items-center"
                >
                    {category.icon}
                    {category.name}
                </Button>
            ))}
        </div>
      </div>

      {loading ? (
        renderSkeleton()
      ) : filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => {
            const phoneNumber = service.provider?.phoneNumber?.replace(/\D/g, '');
            const message = encodeURIComponent(`Hola, te contacto desde AFKEcosystem. Estoy interesado/a en tu servicio de '${service.name}'.`);
            
            return (
              <Card key={service.id} className="flex flex-col transition-shadow duration-300 hover:shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <Badge variant="secondary">${service.price ? service.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</Badge>
                    </div>
                  <CardDescription className="pt-2">
                    <Link href={`/profile/${service.providerId}`} className="flex items-center gap-2 group">
                      <Avatar className="h-8 w-8">
                          <AvatarImage src={service.provider?.photoURL} />
                          <AvatarFallback>{service.provider?.displayName?.[0] || 'P'}</AvatarFallback>
                      </Avatar>
                       <span className="text-sm font-medium group-hover:underline text-foreground">
                          {service.provider?.displayName || 'Ver Proveedor'}
                       </span>
                    </Link>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/cases/create?providerId=${service.providerId}&serviceName=${encodeURIComponent(service.name)}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Crear Caso
                          </Link>
                      </Button>
                     {phoneNumber && (
                        <Button asChild size="sm">
                            <a href={`https://wa.me/${phoneNumber}?text=${message}`} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon />
                                Contactar
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
            <h2 className="text-xl font-semibold">No se encontraron servicios</h2>
            <p className="text-muted-foreground mt-2">Prueba con otra búsqueda o filtro. ¡O anima a más proveedores a unirse!</p>
        </div>
      )}
    </div>
  );
}
