// src/app/dashboard/creditos/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, HandCoins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreditosPage() {
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
            <HandCoins className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">
            Microcréditos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            El acceso a financiamiento no debería ser una barrera. Aquí, la comunidad invierte en la comunidad.
            <br /><br />
            Este módulo permitirá la creación de fondos colaborativos para apoyar proyectos emergentes, validando ideas y fortaleciendo la confianza.
            <br /><br />
            <span className="font-semibold text-foreground">
              Próximamente: Solicita y contribuye a microcréditos para hacer realidad nuevas ideas.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
