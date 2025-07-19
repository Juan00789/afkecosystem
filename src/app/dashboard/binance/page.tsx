// src/app/dashboard/binance/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CandlestickChart, Wallet, History, Bot } from 'lucide-react';

export default function BinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Binance Integration Hub</h1>
        <p className="text-muted-foreground">
          Connect your services with the Binance ecosystem. Manage payments, track assets, and more.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CandlestickChart className="h-6 w-6 text-primary" />
              <span>Live Prices</span>
            </CardTitle>
            <CardDescription>
              View real-time cryptocurrency prices. (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">This feature is under development.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              <span>Portfolio Tracker</span>
            </CardTitle>
             <CardDescription>
              Monitor your asset portfolio. (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This feature is under development.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              <span>Payment History</span>
            </CardTitle>
            <CardDescription>
              Review your transaction history. (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This feature is under development.</p>
          </CardContent>
        </Card>
        
         <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span>Trading Bot Services</span>
            </CardTitle>
            <CardDescription>
             Offer or utilize automated trading bot services. (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This feature is under development.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
