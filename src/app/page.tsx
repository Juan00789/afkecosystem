// src/app/page.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Heart, BookOpen, Layers, Sparkles } from 'lucide-react';
import Image from 'next/image';

const modules = [
  {
    icon: <Layers className="h-8 w-8 text-primary" />,
    title: 'Broki',
    description: 'Conexión entre talentos diversos. Colaborar es construir con alma.',
  },
  {
    icon: <Heart className="h-8 w-8 text-primary" />,
    title: 'Moneda',
    description: 'Reputación emocional como valor. Ayudar también recompensa.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Contenido',
    description: 'Galería de memorias vivas. Lo que se comparte, se siente.',
  },
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: 'Oniara',
    description: 'Centro espiritual del sistema. Protege la intención desde lo invisible.',
  },
];


export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AFKEcosystem</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
                <Link href="/auth/sign-in">Login</Link>
            </Button>
             <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[500px] w-full">
            <div className="absolute inset-0 z-0">
                 <Image
                    src="https://placehold.co/1920x1080.png"
                    alt="Fondo colaborativo"
                    layout="fill"
                    objectFit="cover"
                    className="opacity-50"
                    data-ai-hint="collaboration community work"
                 />
                 <div className="absolute inset-0 bg-black/50"></div>
            </div>
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">AFKEcosystem</h1>
                <p className="mt-4 max-w-2xl text-lg md:text-xl text-neutral-200">
                    Empoderando a microemprendedores y fortaleciendo comunidades locales.
                </p>
                <Button size="lg" className="mt-8" asChild>
                    <Link href="/auth/sign-in">Comenzar ahora</Link>
                </Button>
            </div>
        </section>

        {/* Modules Section */}
        <section className="py-16 md:py-24 bg-muted/20">
            <div className="container mx-auto max-w-5xl px-4 md:px-6">
                 <h2 className="text-center text-3xl md:text-4xl font-bold text-primary mb-12">
                    Módulos con propósito
                </h2>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {modules.map((module) => (
                        <Card key={module.title} className="text-center transition-transform duration-300 hover:-translate-y-2">
                           <CardHeader>
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                                    {module.icon}
                                </div>
                                <CardTitle className="text-primary">{module.title}</CardTitle>
                           </CardHeader>
                           <CardContent>
                                <p className="text-sm text-muted-foreground">{module.description}</p>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="bg-neutral-800 text-neutral-300">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-center md:flex-row md:px-6">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} AFKEcosystem. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-primary hover:underline">
              Contacto
            </Link>
            <Link href="#" className="text-sm text-primary hover:underline">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
