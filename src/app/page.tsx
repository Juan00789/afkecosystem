// src/app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  doc,
  getDoc,
  DocumentData,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Briefcase } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  providerId: string;
}

interface ProviderProfile {
  fullName?: string;
  companyName?: string;
  website?: string;
}

interface Provider extends ProviderProfile {
  id: string;
  services: Service[];
}

const fetchProvidersAndServices = async (): Promise<Provider[]> => {
  const servicesSnapshot = await getDocs(query(collection(db, 'services')));
  const servicesByProvider: Record<string, Service[]> = {};
  const providerIds = new Set<string>();

  servicesSnapshot.docs.forEach((doc) => {
    const serviceData = doc.data() as Omit<Service, 'id'>;
    const service = { id: doc.id, ...serviceData };
    if (!servicesByProvider[service.providerId]) {
      servicesByProvider[service.providerId] = [];
    }
    servicesByProvider[service.providerId].push(service);
    providerIds.add(service.providerId);
  });
  
  if (providerIds.size === 0) {
    return [];
  }

  const providerProfiles: Record<string, ProviderProfile> = {};
  const usersQuery = query(collection(db, 'users'), where('uid', 'in', Array.from(providerIds)));
  const usersSnapshot = await getDocs(usersQuery);

  usersSnapshot.forEach((userDoc) => {
    const userData = userDoc.data() as DocumentData;
    providerProfiles[userDoc.id] = {
      fullName: userData.displayName,
      companyName: userData.companyName,
      website: userData.website,
    };
  });


  return Array.from(providerIds).map((id) => ({
    id,
    ...providerProfiles[id],
    services: servicesByProvider[id] || [],
  }));
};


export default function HomePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedProviders = await fetchProvidersAndServices();
        setProviders(fetchedProviders);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">AFKEcosystem</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/auth/sign-in">
              <Button>Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-12 md:px-6 md:py-20">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Connecting Talent with Opportunity
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Discover skilled professionals and the services they offer. Our
              ecosystem makes it easy to find, connect, and collaborate.
            </p>
            <div className="mt-8">
              <Link href="/dashboard/cases/create">
                <Button size="lg">Post a Project</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-muted/40 py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <h3 className="mb-8 text-center text-3xl font-bold">
              Our Professionals
            </h3>
            {loading ? (
              <p className="text-center">Loading professionals...</p>
            ) : providers.length === 0 ? (
                <p className="text-center text-muted-foreground">No professionals have listed services yet.</p>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {providers.map((provider) => (
                  <Card key={provider.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{provider.fullName || 'Anonymous Provider'}</span>
                        {provider.website && (
                           <a
                            href={provider.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                      </CardTitle>
                      {provider.companyName && (
                        <p className="text-sm text-muted-foreground">
                          {provider.companyName}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <h4 className="mb-2 font-semibold">Services Offered:</h4>
                        <div className="space-y-2">
                         {provider.services.map((service) => (
                           <div key={service.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                             <span>{service.name}</span>
                             <Badge variant="secondary">${service.price.toFixed(2)}</Badge>
                           </div>
                         ))}
                       </div>
                    </CardContent>
                     <CardFooter>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/profile/${provider.id}`}>View Profile & Contact</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 md:px-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AFKEcosystem. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm hover:underline">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
