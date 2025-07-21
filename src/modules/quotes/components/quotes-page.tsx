// src/modules/quotes/components/quotes-page.tsx
'use client';
import { useState, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Paperclip, X, Sparkles, Trash2, GraduationCap, FileText, Download } from 'lucide-react';
import { chatWithOniara } from '@/ai/flows/oniara-flow';
import type { ChatWithOniaraHistory, GeneratedCourse, Message, ModelResponse } from '@/ai/flows/oniara-types';
import type { GenerateQuoteOutput } from '@/ai/flows/quote-flow';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';


type Inputs = {
  message: string;
};

interface AttachedFile {
  name: string;
  dataUri: string;
}

export function QuotesPage() {
  const [history, setHistory] = useState<ChatWithOniaraHistory>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { register, handleSubmit, reset, watch } = useForm<Inputs>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUri = loadEvent.target?.result as string;
        setAttachedFile({ name: file.name, dataUri });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCourse = async (course: GeneratedCourse) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to save a course.', variant: 'destructive' });
      return;
    }

    try {
      await addDoc(collection(db, 'courses'), {
        ...course,
        providerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({
        title: '¡Curso guardado!',
        description: 'Tu nuevo curso ha sido añadido a "Mis Cursos".',
        action: (
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/my-courses')}>
                Ver mis cursos
            </Button>
        )
      });
      // Remove the course from the history to clean up the chat
      setHistory(prev => prev.filter(msg => msg.content.type !== 'course'));
    } catch (error) {
      console.error('Error saving course:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el curso.', variant: 'destructive' });
    }
  };
  
   const handleDownloadQuote = (quote: GenerateQuoteOutput) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Cotización", 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Para: ${quote.clientInfo.name}`, 14, 40);
    doc.text(`De: ${quote.providerInfo.name}`, 14, 46);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 148, 40);

    const tableColumn = ["Descripción", "Cant.", "Precio Unit.", "Total"];
    const tableRows: (string|number)[][] = [];
    quote.items.forEach(item => {
        const itemData = [
            item.description,
            item.quantity,
            `$${item.unitPrice.toFixed(2)}`,
            `$${item.total.toFixed(2)}`
        ];
        tableRows.push(itemData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;
    
    doc.setFontSize(12);
    doc.text(`Subtotal: $${quote.subtotal.toFixed(2)}`, 148, finalY + 10);
    doc.text(`Impuestos (18%): $${quote.tax.toFixed(2)}`, 148, finalY + 17);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total General: $${quote.grandTotal.toFixed(2)}`, 148, finalY + 24);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if(quote.notes) {
      doc.text("Notas:", 14, finalY + 35);
      doc.text(quote.notes, 14, finalY + 40, { maxWidth: 180 });
    }

    doc.save(`cotizacion-${quote.clientInfo.name.replace(/\s/g, '_')}.pdf`);
  };

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    if (!data.message.trim() && !attachedFile) return;

    const userMessage = data.message;
    const userMessageText = userMessage + (attachedFile ? `\n\n(Archivo adjunto: ${attachedFile.name})` : '');
    
    const newHistory: ChatWithOniaraHistory = [
      ...history,
      { role: 'user', content: { type: 'text', text: userMessageText } },
    ];
    setHistory(newHistory);
    reset();
    setIsLoading(true);

    try {
      const fileDataUri = attachedFile?.dataUri;
      setAttachedFile(null); // Clear file after including it in the submission
      
      const modelResponse = await chatWithOniara(history, userMessage, fileDataUri);
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
          content: { type: 'text', text: 'Lo siento, tuve un problema para conectarme. ¿Podrías intentarlo de nuevo?' },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
   const renderMessageContent = (message: Message) => {
    if (message.content.type === 'course') {
        const course = message.content.course;
        return (
            <Card className="bg-primary/5">
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <Sparkles className="h-6 w-6 text-primary mt-1"/>
                        <div>
                            <CardTitle>¡He generado un borrador de curso para ti!</CardTitle>
                            <CardDescription>Revisa el contenido y decide si quieres guardarlo.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                    <ul className="space-y-2">
                        {course.steps.map((step, index) => (
                            <li key={index} className="text-sm font-medium">
                                <span className="text-primary">Paso {index + 1}:</span> {step.title}
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                     <Button variant="ghost" onClick={() => setHistory(prev => prev.filter(m => m !== message))}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Descartar
                    </Button>
                    <Button onClick={() => handleSaveCourse(course)}>
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Añadir a mis cursos
                    </Button>
                </CardFooter>
            </Card>
        )
    }
    if (message.content.type === 'quote') {
        const quote = message.content.quote;
        return (
            <Card className="bg-secondary/5 w-full">
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <FileText className="h-6 w-6 text-secondary mt-1"/>
                        <div>
                            <CardTitle>Aquí tienes tu cotización</CardTitle>
                            <CardDescription>Revisa los detalles y descárgala en PDF.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-sm space-y-2">
                       <p><strong>Para:</strong> {quote.clientInfo.name}</p>
                       <p><strong>De:</strong> {quote.providerInfo.name}</p>
                    </div>
                    <div className="mt-4 border-t pt-4">
                        <ul className="space-y-1">
                            {quote.items.map((item, index) => (
                                <li key={index} className="flex justify-between text-sm">
                                    <span>{item.description} ({item.quantity})</span>
                                    <span className="font-mono">${item.total.toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                         <div className="border-t mt-2 pt-2 space-y-1 text-right">
                             <p className="text-sm">Subtotal: <span className="font-mono">${quote.subtotal.toFixed(2)}</span></p>
                             <p className="text-sm">Impuestos (18%): <span className="font-mono">${quote.tax.toFixed(2)}</span></p>
                             <p className="font-bold">Total: <span className="font-mono">${quote.grandTotal.toFixed(2)}</span></p>
                         </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setHistory(prev => prev.filter(m => m !== message))}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Descartar
                    </Button>
                    <Button onClick={() => handleDownloadQuote(quote)}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    // It's a text message
    return (
         <div
            className={cn(
              'max-w-md rounded-lg p-3',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            )}
          >
            <p className="whitespace-pre-wrap text-sm">{message.content.text}</p>
          </div>
    );
  };


  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
       <header className="mb-4">
        <h1 className="text-3xl font-bold">Habla con Oniara 🤖</h1>
        <p className="text-muted-foreground">Tu asistente de IA para ayudarte a crecer. Pídele que genere una cotización, cree un curso o analice un archivo.</p>
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
              {renderMessageContent(msg)}
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
                    <p className="text-xs">Puedes pedirme que cree un curso para ti, que genere una cotización, o adjuntar un archivo para que lo analice.</p>
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
        className="mt-4 flex flex-col gap-2"
      >
        {attachedFile && (
          <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm">
            <span className="truncate pr-2">Adjunto: {attachedFile.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setAttachedFile(null);
                if(fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
            />
            <Input
            {...register('message')}
            placeholder="Escribe tu pregunta o pide que te cree un curso..."
            autoComplete="off"
            disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || (!watch('message') && !attachedFile)}>
            <Send className="h-5 w-5" />
            </Button>
        </div>
      </form>
    </div>
  );
}
