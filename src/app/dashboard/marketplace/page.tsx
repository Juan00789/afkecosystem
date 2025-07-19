// src/app/dashboard/marketplace/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MarketplacePage() {
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
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">
            Marketplace Local
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Un espacio para que el talento local brille. Ofrece tus servicios y encuentra colaboradores en tu propia comunidad.
            <br /><br />
            Desde diseño gráfico hasta consultoría de negocios, este será el punto de encuentro para la economía colaborativa de la región.
            <br /><br />
            <span className="font-semibold text-foreground">
             Próximamente: Publica tus servicios y explora oportunidades cerca de ti.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
