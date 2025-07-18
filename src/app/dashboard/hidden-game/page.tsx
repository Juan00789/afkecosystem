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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { converseHiddenGame, type HiddenGameOutput } from '@/ai/flows/hidden-game-flow';
import { Loader2, Sparkles } from 'lucide-react';

export default function HiddenGamePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<HiddenGameOutput | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
        toast({
            variant: 'destructive',
            title: 'Mensaje vacío',
            description: 'Por favor, escribe algo para comenzar la conversación.',
        });
        return;
    }
    setLoading(true);
    setConversation(null);
    try {
      const result = await converseHiddenGame({ message });
      setConversation(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error en la conversación',
        description: 'Hubo un problema al contactar a la IA. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle>La Ley del Juego Oculto</CardTitle>
            </div>
            <CardDescription>
              Inicia una conversación con el sabio. Pregunta, reflexiona y explora las corrientes invisibles de la vida.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48 rounded-md bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : conversation ? (
              <div className="p-4 bg-muted rounded-md min-h-48">
                <p className="whitespace-pre-wrap">{conversation.response}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md">
                <p className="text-muted-foreground text-center">La respuesta del sabio aparecerá aquí.<br/>¿Qué pieza moverás primero?</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
              <Input
                placeholder="Escribe tu mensaje aquí..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
