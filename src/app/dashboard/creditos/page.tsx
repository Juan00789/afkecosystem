// src/app/dashboard/creditos/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, HandCoins, Award, CheckCircle, BookOpen, UserPlus, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

const waysToEarn = [
  {
    icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    title: 'Resolver un Caso',
    description: 'Gana 10 créditos cada vez que un caso se marca como completado.',
  },
  {
    icon: <BookOpen className="h-6 w-6 text-blue-500" />,
    title: 'Crear un Microcurso',
    description: 'Gana 25 créditos por cada nuevo curso que compartas con la comunidad.',
  },
  {
    icon: <UserPlus className="h-6 w-6 text-purple-500" />,
    title: 'Expandir tu Red',
    description: 'Gana 5 créditos la primera vez que añades un cliente y un proveedor.',
  },
];

export default function CreditosPage() {
  const { userProfile, loading } = useAuth();

  return (
    <div className="container mx-auto max-w-5xl p-4">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <HandCoins className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight text-primary">
                        Sistema de Microcréditos
                        </CardTitle>
                        <CardDescription className="text-lg">
                        Participa, aporta valor y gana créditos para invertir en la comunidad.
                        </CardDescription>
                    </div>
                </div>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">
                    Los créditos son la moneda de la confianza y colaboración en AFKEcosystem. Acumúlalos participando activamente y úsalos para acceder a oportunidades únicas dentro de la plataforma.
                </p>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Cómo Ganar Créditos</CardTitle>
                    <CardDescription>Completa estas acciones para aumentar tu balance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {waysToEarn.map(way => (
                        <div key={way.title} className="flex items-start gap-4 p-3 rounded-lg bg-card-foreground/5">
                            <div className="flex-shrink-0">{way.icon}</div>
                            <div>
                                <h3 className="font-semibold">{way.title}</h3>
                                <p className="text-sm text-muted-foreground">{way.description}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-1">
             <Card className="text-center sticky top-24">
                <CardHeader>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20 mb-4">
                        <Award className="h-10 w-10 text-secondary" />
                    </div>
                    <CardTitle className="text-xl font-bold">Tu Balance de Créditos</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <Skeleton className="h-16 w-32 mx-auto" />
                    ) : (
                        <p className="text-6xl font-extrabold text-secondary">
                            {userProfile?.credits || 0}
                        </p>
                    )}
                    <p className="text-muted-foreground mt-2">créditos</p>
                     <p className="text-xs text-muted-foreground mt-8">
                        Próximamente: Podrás usar tus créditos para destacar servicios, acceder a mentorías exclusivas y mucho más.
                    </p>
                </CardContent>
            </Card>
        </div>

      </div>

    </div>
  );
}
