
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter as TableFooterUI,
} from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';
import { generateQuote, type GenerateQuoteOutput } from '@/ai/flows/quote-flow';
import { Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { db, getFirebaseAuth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import * as XLSX from 'xlsx';


interface Client {
  id: string;
  name: string;
}

interface UserProfile {
    name?: string;
    company?: string;
    website?: string;
    bankName?: string;
    accountNumber?: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export function QuotesPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    projectName: '',
    projectDetails: '',
    model: 'gemini-1.5-flash-latest',
  });
  const [quote, setQuote] = useState<GenerateQuoteOutput | null>(null);

   useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoadingData(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setUserProfile({});
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    let unsubProfile: () => void;
    let unsubClients: () => void;

    const fetchAllData = async () => {
        const profileRef = doc(db, 'users', user.uid);
        unsubProfile = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
            }
        });
        
        const clientsQuery = query(collection(db, 'clients'), where('providerId', '==', user.uid));
        unsubClients = onSnapshot(clientsQuery, (snapshot) => {
            const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
            setClients(clientsData);
            setLoadingData(false);
        }, (error) => {
            console.error("Error fetching clients: ", error);
            toast({
                variant: 'destructive',
                title: 'Error al cargar clientes',
            });
            setLoadingData(false);
        });
    }

    fetchAllData();

    return () => {
        if (unsubProfile) unsubProfile();
        if (unsubClients) unsubClients();
    };
  }, [user, toast]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleModelChange = (model: string) => {
    setForm(prev => ({ ...prev, model: model }));
  };

  const handleClientAutocomplete = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setForm(prev => ({ ...prev, clientName: client.name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim()) {
        toast({
            variant: 'destructive',
            title: 'Nombre del cliente requerido',
        });
        return;
    }
    setLoading(true);
    setQuote(null);
    try {
      const payload = {
          ...form,
          providerName: userProfile.name,
          providerCompany: userProfile.company,
          providerWebsite: userProfile.website,
          providerBankName: userProfile.bankName,
          providerAccountNumber: userProfile.accountNumber,
      }
      const result = await generateQuote(payload);
      setQuote(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al generar la cotización',
        description: 'Hubo un problema al contactar a la IA. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!quote || !form.projectName) return;

    const wb = XLSX.utils.book_new();
    
    // Main data for the sheet
    const quoteData = [
      ["Proyecto:", form.projectName],
      ["Cliente:", form.clientName],
      [],
      ["Descripción", "Cantidad", "Precio Unitario", "Total"],
      ...quote.items.map(item => [item.description, item.quantity, item.unitPrice, item.total]),
      [],
      ["", "", "Subtotal", quote.subtotal],
      ["", "", "Impuestos (18%)", quote.tax],
      ["", "", "Total General", quote.grandTotal],
      [],
      ["Notas:", quote.notes]
    ];

    const ws = XLSX.utils.aoa_to_sheet(quoteData);

    // Styling and formatting
    ws['!cols'] = [{ wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
    
    const currencyFormat = '$#,##0.00';
    const numberFormat = '#,##0';

    quote.items.forEach((_, index) => {
        const rowIndex = index + 5;
        ws[`B${rowIndex}`].z = numberFormat;
        ws[`C${rowIndex}`].z = currencyFormat;
        ws[`D${rowIndex}`].z = currencyFormat;
    });

    const subtotalRow = quote.items.length + 7;
    ws[`D${subtotalRow}`].z = currencyFormat;
    ws[`D${subtotalRow + 1}`].z = currencyFormat;
    ws[`D${subtotalRow + 2}`].z = currencyFormat;

    XLSX.utils.book_append_sheet(wb, ws, "Cotización");
    XLSX.writeFile(wb, `Cotizacion_${form.projectName.replace(/\s+/g, '_')}.xlsx`);
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Generar Nueva Cotización</CardTitle>
            <CardDescription>
              Completa los detalles para que la IA genere una cotización profesional y estructurada.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del Cliente</Label>
                <div className="flex gap-2">
                  <Input 
                    id="clientName"
                    name="clientName"
                    placeholder="Escribe el nombre del cliente"
                    value={form.clientName}
                    onChange={handleInputChange}
                    required
                  />
                   <Select onValueChange={handleClientAutocomplete} disabled={loadingData || clients.length === 0}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={loadingData ? "Cargando..." : "Autocompletar"} />
                      </SelectTrigger>
                      <SelectContent>
                          {clients.length > 0 ? (
                              clients.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                      {client.name}
                                  </SelectItem>
                              ))
                          ) : (
                             <SelectItem value="no-clients" disabled>No hay clientes</SelectItem>
                          )}
                      </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="model">Modelo de IA</Label>
                  <Select onValueChange={handleModelChange} defaultValue={form.model}>
                      <SelectTrigger>
                          <SelectValue placeholder="Elige un modelo" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="gemini-1.5-flash-latest">Gemini 1.5 Flash</SelectItem>
                          <SelectItem value="gemini-1.5-pro-latest">Gemini 1.5 Pro</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName">Nombre del Proyecto</Label>
                <Input 
                  id="projectName" 
                  name="projectName" 
                  placeholder="Ej: Desarrollo de Sitio Web Corporativo" 
                  value={form.projectName}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectDetails">Detalles del Proyecto</Label>
                <Textarea
                  id="projectDetails"
                  name="projectDetails"
                  placeholder="Describe el alcance, los requerimientos, y cualquier otro detalle importante..."
                  className="min-h-[150px]"
                  value={form.projectDetails}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading || loadingData}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar Cotización
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Cotización Generada</CardTitle>
            <CardDescription>
              Revisa la cotización desglosada. Puedes descargarla en formato Excel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {quote && (
                <div className="space-y-4">
                    <p className="text-sm p-3 bg-muted rounded-md"><span className="font-semibold">Resumen:</span> {quote.summary}</p>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-center">Cant.</TableHead>
                                    <TableHead className="text-right">Precio Unit.</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quote.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooterUI className="bg-muted/50">
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(quote.subtotal)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-medium">Impuestos (18%)</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(quote.tax)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-semibold text-lg">Total General</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(quote.grandTotal)}</TableCell>
                                </TableRow>
                            </TableFooterUI>
                        </Table>
                    </div>
                     <div>
                        <Label>Notas y Términos</Label>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 border rounded-md min-h-[60px]">{quote.notes}</p>
                    </div>
                </div>
              )}
              {!loading && !quote && (
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md">
                    <p className="text-muted-foreground">La cotización aparecerá aquí.</p>
                </div>
              )}
          </CardContent>
          <CardFooter className="justify-between">
             <Button 
                onClick={handleDownloadExcel}
                disabled={!quote || loading}
                variant="outline"
            >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Descargar Excel
            </Button>
             <Button disabled={!quote || loading}>Guardar y Enviar</Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
