import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 lg:p-6">
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
        <Button asChild>
          <Link href="/dashboard">Ingresar</Link>
        </Button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-tight">
            Bienvenido a AFKEcosystem
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground">
            Conectando personas, simplificando procesos. La solución integral para la gestión de tus clientes, casos y cotizaciones, potenciada por inteligencia artificial.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Comenzar ahora <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm">
        © {new Date().getFullYear()} AFKEcosystem. Todos los derechos reservados.
      </footer>
    </div>
  );
}
