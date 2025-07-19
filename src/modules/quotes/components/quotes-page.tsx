// src/modules/quotes/components/quotes-page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateQuote, type GenerateQuoteOutput } from '@/ai/flows/quote-flow';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Bot } from 'lucide-react';

interface Client {
  id: string;
  displayName: string;
}

const quoteSchema = z.object({
  clientId: z.string().min(1, 'Please select a client'),
  projectDetails: z.string().min(10, 'Details must be at least 10 characters'),
});
type QuoteFormData = z.infer<typeof quoteSchema>;

export function QuotesPage() {
  const { user, userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [generatedQuote, setGeneratedQuote] = useState<GenerateQuoteOutput | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // A user's clients are users who have the current user in their "providers" network list.
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('network.providers', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedClients = snapshot.docs.map((doc) => ({
        id: doc.id,
        displayName: doc.data().displayName || doc.data().email || 'Unnamed Client',
      }));
      setClients(fetchedClients);
    });

    return () => unsubscribe();
  }, [user]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { clientId: '', projectDetails: '' },
  });

  const onSubmit = async (data: QuoteFormData) => {
    if (!user || !userProfile) return;
    setLoading(true);
    setGeneratedQuote(null);
    try {
      const clientDoc = await getDoc(doc(db, 'users', data.clientId));
      const clientName = clientDoc.data()?.displayName || 'Valued Client';

      const quote = await generateQuote({
        clientName: clientName,
        providerName: userProfile.displayName || 'Me',
        projectDetails: data.projectDetails,
      });

      // Pre-fill notes with bank info if available
      if (userProfile.bankInfo?.bankName && userProfile.bankInfo?.accountNumber) {
        const bankDetails = `Payment Information:\nBank: ${userProfile.bankInfo.bankName}\nAccount: ${userProfile.bankInfo.accountNumber}`;
        quote.notes = quote.notes ? `${quote.notes}\n\n${bankDetails}` : bankDetails;
      }
      
      setGeneratedQuote(quote);
    } catch (error) {
      console.error('Error generating quote:', error);
    } finally {
      setLoading(false);
    }
  };

   const handleDownloadExcel = () => {
    if (!generatedQuote) return;
    
    const { items, subtotal, tax, grandTotal, notes, clientInfo, providerInfo } = generatedQuote;
    
    // Create worksheet data
    const wsData = [
      ["Quote"],
      [],
      ["From:", providerInfo.name],
      ["To:", clientInfo.name],
      [],
      ["Description", "Quantity", "Unit Price", "Total"],
      ...items.map(item => [item.description, item.quantity, item.unitPrice, item.total]),
      [],
      ["", "", "Subtotal", subtotal],
      ["", "", "Tax (18%)", tax],
      ["", "", "Grand Total", grandTotal],
      [],
      ["Notes:"],
      [notes || ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quote");

    XLSX.writeFile(wb, "Quote.xlsx");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate a New Quote</CardTitle>
          <CardDescription>
            Fill in the details below and let AI create a professional quote for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDetails">Project Details</Label>
              <Controller
                name="projectDetails"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Describe the work to be done..."
                    className="min-h-[150px]"
                  />
                )}
              />
              {errors.projectDetails && <p className="text-sm text-destructive">{errors.projectDetails.message}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
               {loading ? (
                <>
                  <Bot className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Quote with AI'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
           <div className="flex justify-between items-center">
             <div>
              <CardTitle>Generated Quote</CardTitle>
              <CardDescription>Review the AI-generated quote below.</CardDescription>
            </div>
             {generatedQuote && (
                <Button variant="outline" size="sm" onClick={handleDownloadExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-12 w-12 mb-4 animate-pulse" />
                <p className="text-muted-foreground">AI is crafting your quote...</p>
             </div>
          )}
          {!loading && !generatedQuote && (
             <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed rounded-lg p-12">
                <p className="text-muted-foreground">Your quote will appear here once generated.</p>
             </div>
          )}
          {generatedQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>From:</strong> {generatedQuote.providerInfo.name}</div>
                <div><strong>To:</strong> {generatedQuote.clientInfo.name}</div>
              </div>
              
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {generatedQuote.items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">Subtotal</TableCell>
                        <TableCell className="text-right">${generatedQuote.subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">Tax (18%)</TableCell>
                        <TableCell className="text-right">${generatedQuote.tax.toFixed(2)}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold text-lg">Grand Total</TableCell>
                        <TableCell className="text-right font-bold text-lg">${generatedQuote.grandTotal.toFixed(2)}</TableCell>
                    </TableRow>
                </TableFooter>
              </Table>
              
              {generatedQuote.notes && (
                <div>
                  <h4 className="font-semibold">Notes:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{generatedQuote.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
