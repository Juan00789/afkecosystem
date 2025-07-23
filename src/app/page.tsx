// src/app/page.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HandHelping, BookOpen, HandCoins, MessageSquareHeart, Users, Church } from 'lucide-react';

const modules = [
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Directorio de Ministerios',
    description: 'Encuentra y sirve en los diferentes ministerios de nuestra comunidad.',
    href: '/dashboard/marketplace',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Estudios y Recursos',
    description: 'Crece en tu fe con estudios bíblicos y recursos de formación.',
    href: '/dashboard/cursos', 
  },
  {
    icon: <HandCoins className="h-8 w-8 text-primary" />,
    title: 'Fondo de Ayuda Mutua',
    description: 'Solicita y contribuye a un fondo para apoyar proyectos y necesidades.',
    href: '/dashboard/creditos',
  },
  {
    icon: <MessageSquareHeart className="h-8 w-8 text-primary" />,
    title: 'Grupos de Apoyo',
    description: 'Conecta con otros miembros en grupos de oración y apoyo.',
    href: '/dashboard/consultorias',
  },
];


export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Church className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Comunidad de Fe</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
                <Link href="/auth/sign-in">Login</Link>
            </Button>
             <Button asChild>
                <Link href="/dashboard">Acceder</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-card/50 py-20 md:py-32">
            <div className="container mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-primary">Creciendo Juntos en Fe y Comunidad.</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                    Un espacio digital para conectar, servir y fortalecer los lazos de nuestra iglesia.
                </p>
                <Button size="lg" className="mt-8" asChild>
                    <Link href="/auth/sign-in">Únete a la Comunidad</Link>
                </Button>
            </div>
        </section>

        {/* Modules Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto max-w-5xl px-4 md:px-6">
                 <h2 className="text-center text-3xl md:text-4xl font-bold mb-12">
                    Nuestros Pilares
                </h2>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {modules.map((module) => (
                        <Link href={module.href} key={module.title}>
                          <Card className="text-center transition-transform duration-300 hover:-translate-y-2 h-full bg-card hover:bg-card/80">
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
                        </Link>
                    ))}
                </div>
            </div>
        </section>
      </main>

      <footer className="bg-card">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-center md:flex-row md:px-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Comunidad de Fe. Un ministerio de amor y servicio.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-primary hover:underline">
              Nuestra Misión
            </Link>
            <Link href="#" className="text-sm text-primary hover:underline">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
