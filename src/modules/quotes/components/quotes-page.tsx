
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
import { textToSpeech } from '@/ai/flows/tts-flow';
import type { TextToSpeechOutput } from '@/ai/flows/tts-flow.schema';
import { Loader2, Volume2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { User } from 'firebase/auth';

interface Client {
  id: string;
  name: string;
}

export function QuotesPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    projectName: '',
    projectDetails: '',
    model: 'gemini-1.5-flash-latest',
  });
  const [quote, setQuote] = useState<GenerateQuoteOutput | null>(null);
  const [audio, setAudio] = useState<TextToSpeechOutput | null>(null);

   useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoadingClients(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setClients([]);
      setLoadingClients(false);
      return;
    }

    setLoadingClients(true);
    const clientsQuery = query(collection(db, 'clients'), where('providerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(clientsQuery, (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        setClients(clientsData);
        setLoadingClients(false);
    }, (error) => {
        console.error("Error fetching clients: ", error);
        toast({
            variant: 'destructive',
            title: 'Error al cargar clientes',
            description: 'No se pudieron obtener los datos.'
        });
        setLoadingClients(false);
    });

    return () => unsubscribe();
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
            description: 'Por favor, introduce el nombre de un cliente.',
        });
        return;
    }
    setLoading(true);
    setQuote(null);
    setAudio(null);
    try {
      const result = await generateQuote(form);
      setQuote(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error al generar la cotización',
        description: 'Hubo un problema al contactar a la IA. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateAudio = async () => {
    if (!quote?.quoteText) return;
    setGeneratingAudio(true);
    setAudio(null);
    try {
        const result = await textToSpeech(quote.quoteText);
        setAudio(result);
    } catch(error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error al generar el audio',
            description: 'No se pudo convertir el texto a voz. Inténtalo de nuevo.',
        });
    } finally {
        setGeneratingAudio(false);
    }
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generar Nueva Cotización</CardTitle>
            <CardDescription>
              Completa los detalles para que la IA genere una cotización profesional.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
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
                     <Select onValueChange={handleClientAutocomplete} disabled={loadingClients || clients.length === 0}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={loadingClients ? "Cargando..." : "Autocompletar"} />
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
                <div className="space-y-2 col-span-2">
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
              <Button type="submit" disabled={loading || loadingClients}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar Cotización
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cotización Generada</CardTitle>
            <CardDescription>
              Revisa el texto generado. Puedes escucharlo, copiarlo y pegarlo donde necesites.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {quote && (
                <div className="space-y-4">
                    <div>
                        <Label>Resumen</Label>
                        <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{quote.summary}</p>
                    </div>
                    <div>
                        <Label>Texto de la Cotización</Label>
                        <Textarea readOnly value={quote.quoteText} className="min-h-[250px] bg-muted" />
                    </div>
                    {generatingAudio && (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <p className="ml-2 text-muted-foreground">Generando audio...</p>
                        </div>
                    )}
                    {audio?.media && (
                        <div>
                             <Label>Audio de la Cotización</Label>
                            <audio controls className="w-full mt-2" src={audio.media}>
                                Tu navegador no soporta el elemento de audio.
                            </audio>
                        </div>
                    )}
                </div>
              )}
              {!loading && !quote && (
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md">
                    <p className="text-muted-foreground">La cotización aparecerá aquí.</p>
                </div>
              )}
          </CardContent>
          <CardFooter className="justify-between">
             <div>
                <Button 
                    onClick={handleGenerateAudio}
                    disabled={!quote || loading || generatingAudio}
                    variant="outline"
                >
                    {(generatingAudio) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Volume2 className="mr-2 h-4 w-4" />
                    {audio ? 'Volver a generar' : 'Escuchar'}
                </Button>
             </div>
             <Button disabled={!quote || loading}>Guardar y Enviar</Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
