// src/app/dashboard/cursos/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CursosPage() {
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
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">
            Microcursos Exprés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            El conocimiento es poder, y el tiempo es oro. Nuestros microcursos te dan lo esencial en 10 minutos.
             <br /><br />
            Aprende sobre validación de ideas, marketing digital, finanzas para no financieros y mucho más. Contenido práctico y directo para aplicar hoy mismo.
            <br /><br />
            <span className="font-semibold text-foreground">
              Próximamente: Una biblioteca de cursos para acelerar tu crecimiento.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
