'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Briefcase, Rocket } from 'lucide-react';

export default function CasesPage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Briefcase className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Gestión de Casos</CardTitle>
              <CardDescription>
                Administra los casos y solicitudes de tus clientes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center">
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md p-6 bg-secondary/50">
                <Rocket className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Módulo de Casos Próximamente</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                    Estamos trabajando en un sistema completo para que puedas gestionar los casos de tus clientes de manera eficiente. ¡Pronto estará disponible!
                </p>
                <Button disabled>
                    Función en Desarrollo
                </Button>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
