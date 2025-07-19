// src/app/dashboard/broki/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BrokiPage() {
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
            Broki
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Broki es el módulo de conexión entre talentos diversos.
            <br />
            Aquí no se piden currículums, se presentan realidades.
            <br />
            Desde plomeros hasta visionarios del diseño, todos pueden colaborar, ayudar, compartir.
            <br />
            <br />
            <span className="font-semibold text-foreground">
              Tu servicio no se vende: se ofrece con historia.
            </span>
            <br />
            <br />
            Este espacio será el punto de encuentro para quienes hacen mucho con poco.
            <br />
            El puente. El pulso. La raíz de la colaboración sincera.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
