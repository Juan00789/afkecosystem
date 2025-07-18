
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
import { useToast } from '@/hooks/use-toast';
import { converseHiddenGame, type HiddenGameOutput } from '@/ai/flows/hidden-game-flow';
import { Loader2, Sparkles, Lock, Key } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function HiddenGamePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<HiddenGameOutput | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkUserAccess = async () => {
        if (!user) {
            setCheckingAccess(false);
            return;
        }

        try {
            // Check if the user has ever been a provider (i.e., has at least one client)
            const providerQuery = query(collection(db, 'clients'), where('userId', '==', user.uid), limit(1));
            const providerSnapshot = await getDocs(providerQuery);
            const hasBeenProvider = !providerSnapshot.empty;

            // Check if the user has ever been a client (i.e., their email is in a client document)
            const clientQuery = query(collection(db, 'clients'), where('email', '==', user.email), limit(1));
            const clientSnapshot = await getDocs(clientQuery);
            const hasBeenClient = !clientSnapshot.empty;

            setHasAccess(hasBeenClient && hasBeenProvider);
        } catch (error) {
            console.error("Error checking access:", error);
            toast({
                variant: 'destructive',
                title: 'Error de verificación',
                description: 'No se pudo verificar tu acceso al juego.',
            });
            setHasAccess(false);
        } finally {
            setCheckingAccess(false);
        }
    };
    
    checkUserAccess();

  }, [user, toast]);


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

  const renderContent = () => {
    if (checkingAccess) {
        return (
             <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Verificando tu camino...</p>
            </div>
        )
    }

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed rounded-md p-6">
                <Lock className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">La Puerta Permanece Cerrada</h3>
                <p className="max-w-md">
                    El Juego Oculto solo revela sus secretos a quienes han dominado la dualidad.
                    Debes haber experimentado el rol de <span className="text-primary font-medium">proveedor</span> y el de <span className="text-primary font-medium">cliente</span> para entrar.
                </p>
                <p className="mt-2 text-sm">Completa ambos caminos y regresa.</p>
            </div>
        )
    }

    return (
        <>
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
        </>
    )
  }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key className="h-6 w-6 text-primary" />
              <CardTitle>La Ley del Juego Oculto</CardTitle>
            </div>
            <CardDescription>
                {hasAccess
                ? "Inicia una conversación con el sabio. Pregunta, reflexiona y explora las corrientes invisibles de la vida."
                : "Un espacio para aquellos que han visto ambos lados del tablero."
                }
            </CardDescription>
          </CardHeader>
          {renderContent()}
        </Card>
      </div>
    </main>
  );
}
