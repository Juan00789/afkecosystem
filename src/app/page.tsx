
'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const WhatsAppIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
        <title>WhatsApp</title>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.204-1.634a11.86 11.86 0 005.785 1.47h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);


export default function LandingPage() {

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
              Bienvenido a AFKEcosystem
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">
              Conectando personas, simplificando procesos. La solución integral para la gestión de tus clientes, casos y cotizaciones, potenciada por inteligencia artificial.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/login">
                  Comenzar ahora <ArrowRight className="ml-2" />
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
           <p>© {new Date().getFullYear()} AFKEcosystem. Todos los derechos reservados.</p>
           <p className="mt-2">Una plataforma para proveedores de servicios modernos.</p>
        </div>
      </footer>
    </div>
  );
}
