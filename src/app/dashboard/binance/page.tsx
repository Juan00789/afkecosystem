// src/app/dashboard/binance/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CandlestickChart, Wallet, History, Bot } from 'lucide-react';

export default function BinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Centro de Integración de Binance</h1>
        <p className="text-muted-foreground">
          Conecta tus servicios con el ecosistema de Binance. Gestiona pagos, rastrea activos y más.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CandlestickChart className="h-6 w-6 text-primary" />
              <span>Precios en Vivo</span>
            </CardTitle>
            <CardDescription>
              Visualiza los precios de las criptomonedas en tiempo real. (Próximamente)
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">Esta función está en desarrollo.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span>Seguimiento de Portafolio</span>
            </CardTitle>
             <CardDescription>
              Supervisa tu portafolio de activos. (Próximamente)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Esta función está en desarrollo.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              <span>Historial de Pagos</span>
            </CardTitle>
            <CardDescription>
              Revisa tu historial de transacciones. (Próximamente)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Esta función está en desarrollo.</p>
          </CardContent>
        </Card>
        
         <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span>Servicios de Bot de Trading</span>
            </CardTitle>
            <CardDescription>
             Ofrece o utiliza servicios de bot de trading automatizado. (Próximamente)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Esta función está en desarrollo.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
