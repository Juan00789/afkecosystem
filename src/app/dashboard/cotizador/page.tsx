// src/app/dashboard/cotizador/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, FileDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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

type QuoteFormData = z.infer<typeof quoteSchema>;
type QuoteItem = z.infer<typeof quoteItemSchema>;

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

export default function QuoteGeneratorPage() {
  const { user, userProfile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { control, handleSubmit, reset, watch, setValue } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      clientName: '',
      clientAddress: '',
      items: [{ description: '', quantity: 1, price: 0 }],
      notes: '',
      includeITBIS: true,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
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
    const q = query(collection(db, 'services'), where('providerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(servicesList);
    });
    return () => unsubscribe();
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

  const generatePDF = (data: QuoteFormData) => {
    const doc = new jsPDF();
    const companyName = userProfile?.companyName || userProfile?.displayName || 'Mi Empresa';
    const userEmail = userProfile?.email || '';
    const userPhone = userProfile?.phoneNumber || '';
    const bankName = userProfile?.bankInfo?.bankName || '';
    const accountNumber = userProfile?.bankInfo?.accountNumber || '';

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(companyName, 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${userProfile?.displayName || ''}\n${userEmail}\n${userPhone}`, 14, 30);
    
    doc.setFontSize(18);
    doc.text("COTIZACIÓN", 200, 22, { align: 'right' });

    // Client Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("PARA:", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.clientName}\n${data.clientAddress || ''}`, 14, 56);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("FECHA:", 140, 50);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString('es-DO'), 160, 50);


    // Table
    const tableColumn = ["Descripción", "Cantidad", "Precio Unitario", "Total"];
    const tableRows: (string|number)[][] = [];
    data.items.forEach(item => {
        const itemData = [
            item.description,
            item.quantity,
            `$${item.price.toFixed(2)}`,
            `$${(item.quantity * item.price).toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'striped',
        headStyles: { fillColor: [33, 150, 243] } // Primary color
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text("Subtotal:", 140, finalY + 10);
    doc.text(`$${subtotal.toFixed(2)}`, 200, finalY + 10, { align: 'right' });
    if(includeITBIS) {
      doc.text("ITBIS (18%):", 140, finalY + 17);
      doc.text(`$${itbis.toFixed(2)}`, 200, finalY + 17, { align: 'right' });
    }
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 140, finalY + 24);
    doc.text(`$${total.toFixed(2)}`, 200, finalY + 24, { align: 'right' });

    // Notes and Banking Info
    let bottomY = finalY + 40;
    if (data.notes) {
      doc.setFont("helvetica", "bold");
      doc.text("Notas:", 14, bottomY);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(data.notes, 180), 14, bottomY + 6);
      bottomY += 20;
    }
    
    if (bankName || accountNumber) {
      doc.setFont("helvetica", "bold");
      doc.text("Información de Pago:", 14, bottomY);
      doc.setFont("helvetica", "normal");
      doc.text(`${bankName ? `Banco: ${bankName}` : ''}\n${accountNumber ? `Cuenta: ${accountNumber}` : ''}`, 14, bottomY + 6);
    }
    
    doc.save(`Cotizacion-${data.clientName.replace(/\s+/g, '-')}.pdf`);
  };


  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Generador de Cotizaciones</CardTitle>
          <CardDescription>Crea y descarga cotizaciones profesionales para tus clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(generatePDF)} className="space-y-6">
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
              <Label className="text-lg font-semibold">Ítems de la Cotización</Label>
              <div className="space-y-2">
                 <Select onValueChange={handleServiceSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder="O selecciona un servicio existente para añadirlo..." />
                    </SelectTrigger>
                    <SelectContent>
                        {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - ${s.price}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-end border p-4 rounded-lg">
                  <div className="col-span-12 md:col-span-5 space-y-2">
                    <Label>Descripción</Label>
                    <Controller name={`items.${index}.description`} control={control} render={({ field }) => <Input {...field} />} />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-2">
                    <Label>Cantidad</Label>
                    <Controller name={`items.${index}.quantity`} control={control} render={({ field }) => <Input type="number" {...field} />} />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-2">
                    <Label>Precio Unit.</Label>
                    <Controller name={`items.${index}.price`} control={control} render={({ field }) => <Input type="number" step="0.01" {...field} />} />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-2 text-right">
                    <Label>Total</Label>
                    <p className="font-semibold h-10 flex items-center justify-end pr-3">
                      ${(watchedItems[index].quantity * watchedItems[index].price).toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-12 md:col-span-1 flex justify-end">
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, price: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ítem Manualmente
              </Button>
            </div>
            
            <Separator />

            {/* Totals */}
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Controller name="includeITBIS" control={control} render={({ field }) => (
                              <input type="checkbox" id="itbis-checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                          )} />
                          <Label htmlFor="itbis-checkbox" className="text-muted-foreground">ITBIS (18%)</Label>
                        </div>
                        <span className="font-semibold">${itbis.toFixed(2)}</span>
                    </div>
                    <Separator />
                     <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <Separator />
            
            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Controller name="notes" control={control} render={({ field }) => <Textarea id="notes" placeholder="Ej: Válido por 30 días. 50% de inicial para comenzar." {...field} />} />
            </div>

            <Button type="submit" className="w-full">
              <FileDown className="mr-2 h-4 w-4" /> Generar y Descargar PDF
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}