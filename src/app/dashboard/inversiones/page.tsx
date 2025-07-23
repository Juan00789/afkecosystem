// src/app/dashboard/inversiones/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InversionesPage() {
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
            <TrendingUp className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">
            Inversiones del Ecosistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Aquí es donde tus créditos se convierten en capital de crecimiento. Invierte en los proyectos (casos) de otros miembros y obtén un retorno cuando tengan éxito. Es nuestra propia bolsa de valores, impulsada por la confianza y la colaboración.
            <br /><br />
            <span className="font-semibold text-foreground">
              Próximamente: Explora casos abiertos a inversión y sigue el rendimiento de tu portafolio.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
