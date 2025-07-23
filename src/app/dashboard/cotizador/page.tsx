// src/app/dashboard/cotizador/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Wand2, FileText, Bot } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Service, QuoteFormData, QuoteAnalysisOutput, Product } from '@/modules/invoicing/types';
import { generateInvoicePDF } from '@/modules/invoicing/components/invoice-pdf';
import { analyzeQuote } from '@/ai/flows/quote-analysis-flow';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const quoteItemSchema = z.object({
  serviceId: z.string().optional(),
  description: z.string().min(1, "La descripción no puede estar vacía."),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
});

const quoteSchema = z.object({
  clientName: z.string().min(2, "El nombre del cliente es requerido."),
  clientAddress: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "Debes añadir al menos un ítem."),
  notes: z.string().optional(),
  includeITBIS: z.boolean().default(true),
});

export default function QuoteGeneratorPage() {
  const { user, userProfile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QuoteAnalysisOutput | null>(null);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      clientName: '',
      clientAddress: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      notes: '',
      includeITBIS: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });
  
  const watchedItems = watch('items');
  const includeITBIS = watch('includeITBIS');

  const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const itbis = includeITBIS ? subtotal * 0.18 : 0;
  const total = subtotal + itbis;

  useEffect(() => {
    if (!user) return;
    const servicesQuery = query(collection(db, 'services'), where('providerId', '==', user.uid));
    const productsQuery = query(collection(db, 'products'), where('providerId', '==', user.uid));
    
    const unsubServices = onSnapshot(servicesQuery, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(servicesList);
    });

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsList);
    });

    return () => {
        unsubServices();
        unsubProducts();
    };
  }, [user]);
  
  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if(service) {
      append({
        serviceId: service.id,
        description: service.name,
        quantity: 1,
        price: service.price
      });
    }
  }

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if(product) {
      append({
        description: product.name,
        quantity: 1,
        price: product.price,
      });
    }
  };
  
  const onGenerateInvoice = async (data: QuoteFormData) => {
    if (!userProfile || !user) return;
    setIsGenerating(true);
    try {
      // 1. Save invoice to Firestore
      await addDoc(collection(db, 'invoices'), {
        providerId: user.uid,
        ...data,
        subtotal,
        itbis,
        total,
        status: 'sent', // Initial status
        createdAt: serverTimestamp(),
      });

      // 2. Generate PDF
      generateInvoicePDF(data, userProfile);
      
      toast({ title: 'Factura Generada', description: 'La factura ha sido creada y guardada en tus registros.'});
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({ title: 'Error', description: 'No se pudo generar o guardar la factura.', variant: 'destructive'});
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAnalyzeQuote = async () => {
      const formData = watch();
      if (formData.items.length === 0 || !formData.clientName) {
        toast({ title: 'Información Incompleta', description: 'Por favor, añade un cliente y al menos un ítem antes de analizar.', variant: 'destructive'});
        return;
      }
      
      setIsAnalyzing(true);
      setAnalysisResult(null);
      try {
        const result = await analyzeQuote({
            clientName: formData.clientName,
            items: formData.items,
            notes: formData.notes,
        });
        setAnalysisResult(result);
        toast({ title: 'Análisis Completo', description: 'Oniara ha revisado tu cotización.' });
      } catch (error) {
          console.error('Error analyzing quote:', error);
          toast({ title: 'Error de Análisis', description: 'No se pudo analizar la cotización.', variant: 'destructive' });
      } finally {
          setIsAnalyzing(false);
      }
  };


  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Generador de Cotizaciones y Facturas</CardTitle>
          <CardDescription>Crea, analiza y convierte cotizaciones en facturas profesionales.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del Cliente</Label>
                <Controller name="clientName" control={control} render={({ field }) => <Input id="clientName" {...field} />} />
                {errors.clientName && <p className="text-sm text-destructive">{errors.clientName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientAddress">Dirección del Cliente (Opcional)</Label>
                <Controller name="clientAddress" control={control} render={({ field }) => <Input id="clientAddress" {...field} />} />
              </div>
            </div>

            <Separator />
            
            {/* Items */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Ítems</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>Añadir desde Catálogo</Label>
                   <Select onValueChange={handleServiceSelect}>
                      <SelectTrigger><SelectValue placeholder="Selecciona un servicio..." /></SelectTrigger>
                      <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - ${s.price}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                   <Label>&nbsp;</Label> {/* Spacer */}
                   <Select onValueChange={handleProductSelect}>
                      <SelectTrigger><SelectValue placeholder="Selecciona un producto..." /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - ${p.price}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end border p-4 rounded-lg">
                  <div className="col-span-12 md:col-span-5 space-y-2"><Label>Descripción</Label><Controller name={`items.${index}.description`} control={control} render={({ field }) => <Input {...field} />} /></div>
                  <div className="col-span-4 md:col-span-2 space-y-2"><Label>Cantidad</Label><Controller name={`items.${index}.quantity`} control={control} render={({ field }) => <Input type="number" {...field} />} /></div>
                  <div className="col-span-4 md:col-span-2 space-y-2"><Label>Precio</Label><Controller name={`items.${index}.price`} control={control} render={({ field }) => <Input type="number" step="0.01" {...field} />} /></div>
                  <div className="col-span-4 md:col-span-2 space-y-2 text-right"><Label>Total</Label><p className="font-semibold h-10 flex items-center justify-end pr-3">${(watchedItems[index]?.quantity * watchedItems[index]?.price || 0).toFixed(2)}</p></div>
                  <div className="col-span-12 md:col-span-1 flex justify-end"><Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button></div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, price: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Ítem Manualmente</Button>
            </div>
            
            <Separator />

            {/* Totals */}
            <div className="flex justify-end"><div className="w-full max-w-sm space-y-2"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div><div className="flex items-center justify-between"><div className="flex items-center space-x-2"><Controller name="includeITBIS" control={control} render={({ field }) => (<input type="checkbox" id="itbis-checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>)} /><Label htmlFor="itbis-checkbox" className="text-muted-foreground">ITBIS (18%)</Label></div><span className="font-semibold">${itbis.toFixed(2)}</span></div><Separator /><div className="flex justify-between text-xl font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div></div></div>
            
            <Separator />
            
            {/* Notes */}
            <div className="space-y-2"><Label htmlFor="notes">Notas Adicionales</Label><Controller name="notes" control={control} render={({ field }) => <Textarea id="notes" placeholder="Ej: Válido por 30 días. 50% de inicial para comenzar." {...field} />} /></div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Button type="button" onClick={handleAnalyzeQuote} disabled={isAnalyzing} variant="outline" className="w-full sm:w-auto"><Wand2 className="mr-2 h-4 w-4" /> {isAnalyzing ? 'Analizando...' : 'Analizar Cotización con IA'}</Button>
                <Button type="button" onClick={handleSubmit(onGenerateInvoice)} disabled={isGenerating} className="w-full sm:w-auto"><FileText className="mr-2 h-4 w-4" /> {isGenerating ? 'Generando...' : 'Convertir a Factura PDF'}</Button>
            </div>
          </form>

          {isAnalyzing && (
            <div className="space-y-4 mt-6"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-24 w-full" /></div>
          )}

          {analysisResult && (
             <Card className="mt-6 bg-secondary/10 border-primary/20">
              <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-6 w-6" />Análisis de Oniara</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.analysis}</p>
              </CardContent>
            </Card>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
