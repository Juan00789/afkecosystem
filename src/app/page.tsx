
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

const InstagramIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <title>Instagram</title>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.784.297-1.457.717-2.126 1.387C1.344 2.687.925 3.36.63 4.14c-.297.765-.497 1.635-.558 2.913-.058 1.28-.072 1.687-.072 4.947s.015 3.667.072 4.947c.06 1.278.26 2.148.558 2.913.297.784.717 1.457 1.387 2.126.67.67 1.343 1.09 2.126 1.387.765.297 1.635.497 2.913.558 1.28.058 1.687.072 4.947.072s3.667-.015 4.947-.072c1.278-.06 2.148-.26 2.913-.558.784-.297 1.457-.717 2.126-1.387.67-.67 1.09-1.343 1.387-2.126.297-.765.497-1.635.558-2.913.058-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.278-.26-2.148-.558-2.913-.297-.784-.717-1.457-1.387-2.126C21.313 1.344 20.64.925 19.86.63c-.765-.297-1.635-.497-2.913-.558C15.667.015 15.26 0 12 0zm0 2.16c3.203 0 3.585.012 4.85.07 1.17.052 1.805.248 2.227.415.562.217.96.477 1.382.896.42.42.678.82.896 1.382.167.422.363 1.057.413 2.227.058 1.265.07 1.646.07 4.85s-.012 3.585-.07 4.85c-.052 1.17-.248 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.42-.82.678-1.382.896-.422.167-1.057.363-2.227.413-1.265.058-1.646.07-4.85.07s-3.585-.012-4.85-.07c-1.17-.052-1.805-.248-2.227-.413-.562-.217-.96-.477-1.382-.896-.42-.42-.678-.82-.896-1.382-.167-.422-.363-1.057-.413-2.227-.058-1.265-.07-1.646-.07-4.85s.012-3.585.07-4.85c.052-1.17.248-1.805.413-2.227.217-.562.477.96.896-1.382.42-.42.82-.678 1.382-.896.422-.167 1.057.363 2.227.413C8.415 2.172 8.797 2.16 12 2.16zm0 9.24c-1.958 0-3.562 1.604-3.562 3.562s1.604 3.562 3.562 3.562 3.562-1.604 3.562-3.562-1.604-3.562-3.562-3.562zM12 17c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm6.202-8.918c-.62 0-1.12.5-1.12 1.12s.5 1.12 1.12 1.12c.62 0 1.12-.5 1.12-1.12s-.5-1.12-1.12-1.12z"/>
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
}
