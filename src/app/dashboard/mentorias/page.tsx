// src/app/dashboard/mentorias/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MentoriasPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Dashboard
          </Link>
        </Button>
      </div>

      <Card className="text-center">
        <CardHeader>
           <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">
            Mentorías y Foros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Nadie emprende en solitario. La experiencia compartida es el atajo hacia el éxito.
            <br /><br />
            Conecta con mentores que ya han recorrido el camino y participa en foros de discusión para resolver dudas, encontrar socios y validar tus ideas.
            <br /><br />
            <span className="font-semibold text-foreground">
              Próximamente: Agenda una mentoría y únete a la conversación.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
