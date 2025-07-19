
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase, FileText, Users, Search, Handshake, Loader2, MessageCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const WhatsAppIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
        <title>WhatsApp</title>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.204-1.634a11.86 11.86 0 005.785 1.47h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const InstagramIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <title>Instagram</title>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.784.297-1.457.717-2.126 1.387C1.344 2.687.925 3.36.63 4.14c-.297.765-.497 1.635-.558 2.913-.058 1.28-.072 1.687-.072 4.947s.015 3.667.072 4.947c.06 1.278.26 2.148.558 2.913.297.784.717 1.457 1.387 2.126.67.67 1.343 1.09 2.126 1.387.765.297 1.635.497 2.913.558 1.28.058 1.687.072 4.947.072s3.667-.015 4.947-.072c1.278-.06 2.148-.26 2.913-.558.784-.297 1.457-.717 2.126-1.387.67-.67 1.09-1.343 1.387-2.126.297-.765.497-1.635.558-2.913.058-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.278-.26-2.148-.558-2.913-.297-.784-.717-1.457-1.387-2.126C21.313 1.344 20.64.925 19.86.63c-.765-.297-1.635-.497-2.913-.558C15.667.015 15.26 0 12 0zm0 2.16c3.203 0 3.585.012 4.85.07 1.17.052 1.805.248 2.227.415.562.217.96.477 1.382.896.42.42.678.82.896 1.382.167.422.363 1.057.413 2.227.058 1.265.07 1.646.07 4.85s-.012 3.585-.07 4.85c-.052 1.17-.248 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.42-.82.678-1.382.896-.422.167-1.057.363-2.227.413-1.265.058-1.646.07-4.85.07s-3.585-.012-4.85-.07c-1.17-.052-1.805-.248-2.227-.413-.562-.217-.96-.477-1.382-.896-.42-.42-.678.82-.896-1.382-.167-.422-.363-1.057-.413-2.227-.058-1.265-.07-1.646-.07-4.85s.012-3.585.07-4.85c.052-1.17.248 1.805.413 2.227.217-.562.477.96.896-1.382.42-.42.82.678 1.382-.896.422.167 1.057.363 2.227.413C8.415 2.172 8.797 2.16 12 2.16zm0 9.24c-1.958 0-3.562 1.604-3.562 3.562s1.604 3.562 3.562 3.562 3.562-1.604 3.562-3.562-1.604-3.562-3.562-3.562zM12 17c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm6.202-8.918c-.62 0-1.12.5-1.12 1.12s.5 1.12 1.12 1.12c.62 0 1.12-.5 1.12-1.12s-.5-1.12-1.12-1.12z"/>
    </svg>
);

interface Service {
  id: string;
  name: string;
  price: string;
  currency: string;
}

interface Provider {
  id: string;
  name: string;
  photoURL: string;
  website?: string;
  services: Service[];
}

export default function LandingPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const providerIds = [...new Set(servicesSnapshot.docs.map(doc => doc.data().userId))];
        const allServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service & { userId: string }));

        if (providerIds.length === 0) {
          setLoading(false);
          return;
        }

        const usersQuery = query(collection(db, 'users'), where('__name__', 'in', providerIds));
        const usersSnapshot = await getDocs(usersQuery);
        
        const providersData = usersSnapshot.docs.map(doc => {
          const userData = doc.data();
          return {
            id: doc.id,
            name: userData.name || 'Proveedor Anónimo',
            photoURL: userData.photoURL || `https://placehold.co/100x100.png`,
            website: userData.website,
            services: allServices.filter(service => service.userId === doc.id)
          };
        });

        setProviders(providersData);
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-primary"
                  >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-xl font-bold">AFKEcosystem</span>
          </div>
          <nav className="hidden items-center gap-4 md:flex">
             <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Características
              </Link>
              <Link href="#providers" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Proveedores
              </Link>
              <Link href="#contact" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Contacto
              </Link>
          </nav>
           <Button asChild>
                <Link href="/login">Ingresar</Link>
            </Button>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center text-center py-20 md:py-32">
          <div className="container max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tight">
              ¿Buscas a alguien que te atienda o quieres empezar a atender?
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">
              La plataforma que conecta a proveedores de servicios con clientes que necesitan soluciones. Sin esperas. Sin intermediarios.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild variant="outline">
                <Link href="#providers">
                  <Search className="mr-2" />
                  Buscar Ayuda
                </Link>
              </Button>
               <Button size="lg" asChild>
                <Link href="/signup">
                  <Handshake className="mr-2" />
                  Quiero Atender
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 md:py-32 bg-secondary">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">Más Rápido, Más Directo</h2>
              <p className="mt-3 text-muted-foreground">Olvídate de las secretarias y las esperas. Aquí, la comunicación es inmediata.</p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 border rounded-lg bg-card">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Contacto Directo</h3>
                <p className="text-muted-foreground">Habla con tu proveedor a través de la plataforma o directamente a su número. Así de fácil.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 border rounded-lg bg-card">
                 <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sin Intermediarios</h3>
                <p className="text-muted-foreground">Tu mensaje va directo a la persona que puede resolver tu problema, sin filtros ni demoras.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 border rounded-lg bg-card">
                 <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Gestión Simplificada</h3>
                <p className="text-muted-foreground">Desde la cotización hasta el seguimiento, todo en un solo lugar para que te enfoques en lo importante.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="providers" className="py-20 md:py-32">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">Encuentra tu Proveedor Ideal</h2>
              <p className="mt-3 text-muted-foreground">Explora nuestra red de profesionales y los servicios que ofrecen. El próximo paso hacia tu solución está aquí.</p>
            </div>
            {loading ? (
              <div className="flex justify-center mt-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary"/>
              </div>
            ) : providers.length > 0 ? (
              <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {providers.map(provider => (
                  <Card key={provider.id} className="flex flex-col group overflow-hidden">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 border">
                                <AvatarImage src={provider.photoURL} alt={provider.name} data-ai-hint="person face" />
                                <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle>{provider.name}</CardTitle>
                                {provider.website && (
                                <a href={`https://${provider.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                    {provider.website} <ExternalLink className="h-3 w-3" />
                                </a>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      <h4 className="font-semibold text-sm">Servicios Destacados:</h4>
                      {provider.services.length > 0 ? (
                        <ul className="space-y-2">
                          {provider.services.slice(0, 3).map(service => (
                            <li key={service.id} className="flex justify-between items-center text-sm p-2 bg-secondary/50 rounded-md">
                              <span className="font-medium text-secondary-foreground">{service.name}</span>
                              <Badge variant="outline">{service.price} {service.currency}</Badge>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No hay servicios listados.</p>
                      )}
                    </CardContent>
                    <CardFooter className="bg-muted/50 p-4">
                        <Button asChild className="w-full">
                           <Link href="/login">Ver Perfil y Contactar</Link>
                        </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-12 text-center text-muted-foreground">
                <p>Actualmente no hay proveedores de servicios disponibles. ¡Vuelve pronto!</p>
              </div>
            )}
            <div className="mt-12 text-center">
                <Button size="lg" asChild>
                    <Link href="/signup">
                        ¿Quieres ser proveedor? Regístrate aquí <ArrowRight className="ml-2"/>
                    </Link>
                </Button>
            </div>
          </div>
        </section>

        <section id="contact" className="py-20 md:py-32 bg-secondary">
          <div className="container max-w-2xl">
              <div className="text-center">
                  <h2 className="text-3xl md:text-4xl font-bold">¿Listo para empezar?</h2>
                  <p className="mt-3 text-muted-foreground">Envíame un mensaje. Estoy aquí para ayudarte a registrarte y responder cualquier pregunta.</p>
              </div>
              <div className="mt-8 text-center">
                    <Button size="lg" asChild>
                        <Link href="https://wa.me/18299226556" target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon />
                            Contactar por WhatsApp
                        </Link>
                    </Button>
              </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-8">
        <div className="container text-center text-muted-foreground text-sm">
           <div className="flex justify-center gap-4 mb-4">
                <Link href="https://www.instagram.com/blessed_frenzy/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <InstagramIcon />
                    <span className="sr-only">Instagram</span>
                </Link>
           </div>
           <p>© {new Date().getFullYear()} AFKEcosystem. Todos los derechos reservados.</p>
           <p className="mt-2">Una plataforma para proveedores de servicios modernos.</p>
        </div>
      </footer>
    </div>
  );

    