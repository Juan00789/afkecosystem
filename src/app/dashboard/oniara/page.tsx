'use client';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User } from 'lucide-react';
import {
  chatWithOniara,
  type ChatWithOniaraHistory,
} from '@/ai/flows/oniara-flow';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/modules/auth/hooks/use-auth';

type Inputs = {
  message: string;
};

export default function OniaraChatPage() {
  const [history, setHistory] = useState<ChatWithOniaraHistory>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuth();
  const { register, handleSubmit, reset } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    if (!data.message.trim()) return;

    const userMessage = data.message;
    const newHistory: ChatWithOniaraHistory = [
      ...history,
      { role: 'user', content: userMessage },
    ];
    setHistory(newHistory);
    reset();
    setIsLoading(true);

    try {
      const modelResponse = await chatWithOniara(history, userMessage);
      setHistory([
        ...newHistory,
        { role: 'model', content: modelResponse },
      ]);
    } catch (error) {
      console.error('Error chatting with Oniara:', error);
      setHistory([
        ...newHistory,
        {
          role: 'model',
          content: 'Lo siento, tuve un problema para conectarme. ¿Podrías intentarlo de nuevo?',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
       <header className="mb-4">
        <h1 className="text-3xl font-bold">Habla con Oniara 🤖</h1>
        <p className="text-muted-foreground">Tu asistente de IA para ayudarte a crecer.</p>
      </header>
      <ScrollArea className="flex-grow rounded-md border p-4">
        <div className="space-y-6">
          {history.map((msg, index) => (
            <div
              key={index}
              className={cn(
                'flex items-start gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'model' && (
                <Avatar>
                   <AvatarImage src="/oniara-avatar.png" alt="Oniara" />
                   <AvatarFallback>🤖</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-md rounded-lg p-3',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
                {msg.role === 'user' && (
                    <Avatar>
                        <AvatarImage src={userProfile?.photoURL} />
                        <AvatarFallback>{userProfile?.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                )}
            </div>
          ))}
            {history.length === 0 && (
                <div className="text-center text-muted-foreground">
                    <p>¡Hola! Soy Oniara. ¿En qué puedo ayudarte hoy?</p>
                </div>
            )}
           {isLoading && (
            <div className="flex items-start gap-3 justify-start">
               <Avatar>
                  <AvatarImage src="/oniara-avatar.png" alt="Oniara" />
                  <AvatarFallback>🤖</AvatarFallback>
                </Avatar>
                <div className="max-w-md rounded-lg p-3 bg-muted">
                    <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50 [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/50"></span>
                    </div>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 flex items-center gap-2"
      >
        <Input
          {...register('message')}
          placeholder="Escribe tu pregunta aquí..."
          autoComplete="off"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
