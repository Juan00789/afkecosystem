'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CreditCard, ExternalLink } from 'lucide-react';

export default function BillingPage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Facturación y Contabilidad</CardTitle>
              <CardDescription>
                Gestiona tus facturas y contabilidad con la integración de Wave.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center">
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md p-6">
                <h3 className="text-lg font-semibold mb-2">Conecta tu cuenta de Wave</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                    Sincroniza tus clientes y genera facturas automáticamente desde tus cotizaciones aprobadas.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>
                        Conectar con Wave
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Redirigir a Wave?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Estás a punto de ser redirigido a Wave para autorizar de forma segura la conexión con AFKEcosystem.
                        No compartiremos tus datos sin tu permiso.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => console.log("Redirigiendo a Wave...")}>
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
      </Card>
    </main>
  );
}
