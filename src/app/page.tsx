// src/app/page.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, BookOpen, HandCoins, MessageSquareText, Rocket, Bot } from 'lucide-react';

const modules = [
  {
    icon: <ShoppingBag className="h-8 w-8 text-primary" />,
    title: 'Marketplace Local',
    description: 'Vende y compra servicios dentro de tu región para fortalecer la economía local.',
    href: '/dashboard/marketplace',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Microcursos Exprés',
    description: 'Aprende habilidades clave para tu negocio en solo 10 minutos.',
    href: '/dashboard/cursos', 
  },
  {
    icon: <HandCoins className="h-8 w-8 text-primary" />,
    title: 'Microcréditos',
    description: 'Accede a financiamiento colaborativo para impulsar tu próximo gran proyecto.',
    href: '/dashboard/creditos',
  },
  {
    icon: <MessageSquareText className="h-8 w-8 text-primary" />,
    title: 'Consultorías',
    description: 'Conecta con expertos y otros emprendedores para recibir consejos y compartir ideas.',
    href: '/dashboard/consultorias',
  },
];


export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
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
        <section className="bg-card/50 py-20 md:py-32">
            <div className="container mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-primary">Tu idea merece florecer.</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                    En AFKEcosystem, la cultivamos contigo. Transforma tu pasión en un negocio de impacto.
                </p>
                <Button size="lg" className="mt-8" asChild>
                    <Link href="/auth/sign-in">Únete hoy y empieza tu historia</Link>
                </Button>
            </div>
        </section>

        {/* Modules Section */}
        <section className="py-16 md:py-24 bg-background">
            <div className="container mx-auto max-w-5xl px-4 md:px-6">
                 <h2 className="text-center text-3xl md:text-4xl font-bold mb-12">
                    Beneficios Únicos
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
            &copy; {new Date().getFullYear()} AFKEcosystem. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-primary hover:underline">
              Términos
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
