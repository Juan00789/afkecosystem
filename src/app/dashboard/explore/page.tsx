
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Rocket, Search } from 'lucide-react';

export default function ExplorePage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Search className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Explorar Servicios</CardTitle>
              <CardDescription>
                Encuentra proveedores y servicios que te ayuden a crecer.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center">
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md p-6 bg-secondary/50">
                <Rocket className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Marketplace de Servicios Próximamente</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                   Estamos creando un espacio donde podrás conectar con otros profesionales y descubrir nuevos servicios. ¡Espéralo pronto!
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
