
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Send } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to handle form submission will be added later
    alert('Gracias por contactarnos. Pronto nos comunicaremos contigo.');
  };

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
                  <h2 className="text-3xl md:text-4xl font-bold">Contáctanos</h2>
                  <p className="mt-3 text-muted-foreground">¿Tienes alguna pregunta o quieres registrarte como cliente? Déjanos un mensaje.</p>
              </div>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                          <Label htmlFor="name">Nombre</Label>
                          <Input id="name" name="name" required placeholder="Tu nombre completo" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="email">Correo Electrónico</Label>
                          <Input id="email" name="email" type="email" required placeholder="tu@correo.com" />
                      </div>
                  </div>
                   <div className="space-y-2">
                        <Label htmlFor="message">Mensaje</Label>
                        <Textarea id="message" name="message" required placeholder="Escribe tu consulta aquí..." className="min-h-[120px]" />
                    </div>
                    <div className="text-center">
                        <Button type="submit" size="lg">
                            Enviar Mensaje <Send className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
              </form>
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
