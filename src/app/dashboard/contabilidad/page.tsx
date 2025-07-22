// src/app/dashboard/contabilidad/page.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Landmark, BarChart2, FileText, Bot, Upload, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function ContabilidadPage() {
    const { toast } = useToast();
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalysis = async () => {
        setIsAnalyzing(true);
        // Placeholder for AI analysis logic
        setTimeout(() => {
            setAnalysisResult("Análisis de IA (simulado):\n- Mayor gasto: Alquiler ($25,000)\n- Gasto recurrente notable: Publicidad en redes ($5,000)\n- Ahorro potencial: Reducir suscripciones de software ($1,500).");
            setIsAnalyzing(false);
            toast({ title: "Análisis completado", description: "La IA ha revisado tus gastos." });
        }, 2000);
    };

    const handleGenerateInvoice = () => {
        toast({ title: "Factura Generada", description: "La factura en PDF ha sido descargada (simulación)." });
    };

    const handleAskAssistant = () => {
        toast({ title: "Respuesta del Asistente", description: "El ITBIS es un 18% y debes declararlo mensualmente (simulación)." });
    }

  return (
    <div className="container mx-auto max-w-5xl p-4 space-y-8">
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

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis"><BarChart2 className="mr-2 h-4 w-4" /> Análisis de Gastos</TabsTrigger>
          <TabsTrigger value="invoicing"><FileText className="mr-2 h-4 w-4" /> Generación de Facturas</TabsTrigger>
          <TabsTrigger value="assistant"><Bot className="mr-2 h-4 w-4" /> Asistente Fiscal</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Gastos con IA</CardTitle>
              <CardDescription>Sube tu estado de cuenta o un archivo de gastos (CSV, Excel) y nuestra IA lo analizará por ti.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expense-file">Sube tu archivo de gastos</Label>
                <div className="flex items-center gap-2">
                    <Input id="expense-file" type="file" />
                    <Button onClick={handleAnalysis} disabled={isAnalyzing}>
                        <Upload className="mr-2 h-4 w-4" />
                        {isAnalyzing ? 'Analizando...' : 'Analizar'}
                    </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Resultados del Análisis</Label>
                <Textarea 
                    placeholder="Los resultados de la IA aparecerán aquí..." 
                    className="min-h-[150px] bg-muted/50" 
                    readOnly
                    value={analysisResult}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing">
          <Card>
            <CardHeader>
              <CardTitle>Generación de Facturas</CardTitle>
              <CardDescription>Crea facturas profesionales y con los requerimientos fiscales de RD en segundos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="client-name">Nombre del Cliente</Label>
                        <Input id="client-name" placeholder="Juan Pérez" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="client-rnc">RNC/Cédula del Cliente</Label>
                        <Input id="client-rnc" placeholder="001-1234567-8" />
                    </div>
               </div>
               <div className="space-y-2">
                  <Label>Items de la Factura</Label>
                  <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Descripción" />
                      <Input type="number" placeholder="Cantidad" />
                      <Input type="number" placeholder="Precio" />
                  </div>
                   <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Descripción" />
                      <Input type="number" placeholder="Cantidad" />
                      <Input type="number" placeholder="Precio" />
                  </div>
               </div>
               <Button onClick={handleGenerateInvoice}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generar y Descargar Factura
               </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assistant">
          <Card>
            <CardHeader>
              <CardTitle>Asistente Fiscal</CardTitle>
              <CardDescription>Tu asistente personal para recordarte fechas importantes y ayudarte a preparar tus declaraciones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax-question">Haz una pregunta fiscal</Label>
                <Textarea id="tax-question" placeholder="Ej: ¿Cuál es la fecha límite para declarar el IT-1?" />
              </div>
              <Button onClick={handleAskAssistant}>
                <Send className="mr-2 h-4 w-4" />
                Preguntar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
