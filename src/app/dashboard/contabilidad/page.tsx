// src/app/dashboard/contabilidad/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Landmark, BarChart2, FileText, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const features = [
  {
    icon: <BarChart2 className="h-8 w-8 text-primary" />,
    title: 'Análisis de Gastos con IA',
    description: 'Sube tus estados de cuenta o ingresa tus gastos y deja que nuestra IA los analice por ti. Ideal para gestionar tus finanzas personales.',
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Generación de Facturas',
    description: 'Crea facturas profesionales y con los requerimientos fiscales de RD en segundos.',
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: 'Asistente Fiscal',
    description: 'Tu asistente personal para recordarte fechas de pago de impuestos y ayudarte a preparar tus declaraciones.',
  },
];


export default function ContabilidadPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Dashboard
          </Link>
        </Button>
      </div>

      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Landmark className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Contabilidad y Facturación Inteligente</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Simplifica tus finanzas para que puedas enfocarte en lo que realmente importa: hacer crecer tu negocio.
        </p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
            <Card key={feature.title} className="text-center">
              <CardHeader>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                      {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
        ))}
      </div>
      
       <Card className="text-center bg-card/50">
        <CardHeader>
          <CardTitle className="text-2xl text-secondary">
            🚀 ¡Próximamente!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Estamos trabajando para traer estas herramientas a AFKEcosystem. ¡Mantente atento para ser de los primeros en probarlas!
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
