
'use client';
import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { generateQuote, type GenerateQuoteOutput } from '@/ai/flows/quote-flow';
import { Loader2 } from 'lucide-react';


export function QuotesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    projectName: '',
    projectDetails: '',
  });
  const [quote, setQuote] = useState<GenerateQuoteOutput | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setQuote(null);
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
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del Cliente</Label>
                <Input 
                  id="clientName" 
                  name="clientName" 
                  placeholder="Ej: Empresa Innova S.A." 
                  value={form.clientName}
                  onChange={handleInputChange}
                  required 
                />
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
              <Button type="submit" disabled={loading}>
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
              Revisa el texto generado por la IA. Puedes copiarlo y pegarlo donde necesites.
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
                </div>
              )}
              {!loading && !quote && (
                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md">
                    <p className="text-muted-foreground">La cotización aparecerá aquí.</p>
                </div>
              )}
          </CardContent>
          <CardFooter>
             <Button disabled={!quote || loading}>Guardar y Enviar</Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
