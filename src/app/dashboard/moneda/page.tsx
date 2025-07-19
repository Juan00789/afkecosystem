// src/app/dashboard/moneda/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MonedaPage() {
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
          <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">
            Moneda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            La reputación aquí es valor.<br />
            Cada acción positiva, cada ayuda, cada conexión genuina, fortalece tu presencia.<br /><br />
            Este módulo medirá el impacto emocional y colaborativo.<br />
            No se trata de acumular, sino de construir confianza.<br /><br />
            Tu Moneda es el reflejo de tu contribución al ecosistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
