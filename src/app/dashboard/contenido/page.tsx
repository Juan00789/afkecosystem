// src/app/dashboard/contenido/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContenidoPage() {
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
            Contenido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Cada imagen aquí tiene historia.<br />
            Cada texto guarda propósito.<br />
            Cada archivo representa lo que somos.<br /><br />

            Este módulo será la memoria visual y narrativa del sistema.<br />
            No es decoración —es testimonio.<br /><br />

            Bienvenido al archivo emocional de AFKEcosystem.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
