// src/modules/cases/components/case-detail.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, orderBy, addDoc, serverTimestamp, runTransaction, increment, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { Case, Comment, Investment } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, CircleDot, Bot, Sparkles, AlertTriangle,ThumbsUp, Frown, MessageSquare, HandCoins, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { analyzeCaseSentiment, type CaseSentimentOutput } from '@/ai/flows/case-sentiment-flow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { processInvestment } from '@/ai/flows/investment-flow';

const WhatsAppIcon = () => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 mr-2"
      fill="currentColor"
    >
      <path d="M12.04 2.016c-5.49 0-9.957 4.467-9.957 9.957 0 1.906.538 3.696 1.487 5.25L2.015 22l4.904-1.556a9.88 9.88 0 0 0 4.982 1.32c5.49 0 9.956-4.467 9.956-9.957s-4.466-9.957-9.956-9.957zm0 18.15c-1.636 0-3.23-.42-4.62-1.205l-.33-.195-3.434.91.927-3.356-.214-.348a8.35 8.35 0 0 1-1.26-4.96c0-4.54 3.704-8.244 8.244-8.244s8.244 3.704 8.244 8.244-3.704 8.244-8.244 8.244zm4.512-6.136c-.247-.124-1.463-.722-1.69- .808-.226-.086-.39-.124-.555.124-.164.247-.638.808-.782.972-.144.165-.288.185-.535.062-.247-.124-.927-.34-1.767-1.09s-1.402-1.636-1.402-1.928c0-.29.313-.446.425-.554.112-.108.247-.287.37-.47.124-.184.165-.307.247-.514.082-.206.04-.385-.02-.51-.06-.124-.555-1.33-.76-1.822-.206-.49-.413-.422-.555-.43-.144-.007-.308-.007-.472-.007a.95.95 0 0 0-.68.307c-.226.247-.873.85-1.07 2.06s-.206 2.223.04 2.514c.247.29 1.424 2.223 3.456 3.036 2.032.813 2.032.544 2.398.514.367-.03.928-.38 1.05- .74.124-.36.124-.67.082-.81z" />
    </svg>
);


const StatusTracker = ({ currentStatus }: { currentStatus: Case['status'] }) => {
  const statuses: Case['status'][] = ['new', 'in-progress', 'completed'];
  const currentIndex = statuses.indexOf(currentStatus);

  const getStatusIcon = (status: Case['status'], index: number) => {
    if (index < currentIndex || currentStatus === 'completed') {
      return <CheckCircle className="h-6 w-6 text-primary" />;
    }
    if (index === currentIndex) {
      return <CircleDot className="h-6 w-6 text-primary animate-pulse" />;
    }
    return <Circle className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
      {statuses.map((status, index) => (
        <div key={status} className="flex flex-col items-center text-center">
          {getStatusIcon(status, index)}
          <p className={cn(
            "text-sm font-medium mt-1 capitalize",
            index <= currentIndex ? "text-primary" : "text-muted-foreground"
          )}>
            {status.replace('-', ' ')}
          </p>
        </div>
      ))}
    </div>
  );
};

interface CaseDetailProps {
  caseId: string;
}

export function CaseDetail({ caseId }: CaseDetailProps) {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CaseSentimentOutput | null>(null);
  const [isInvesting, setIsInvesting] = useState(false);
  const [isInvestmentDialogOpen, setIsInvestmentDialogOpen] = useState(false);

  const getStatusVariant = useCallback((status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'in-progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  }, []);

  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    const caseRef = doc(db, 'cases', caseId);

    const unsubscribeCase = onSnapshot(caseRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Case, 'id'>;
        
        const clientSnap = await getDoc(doc(db, 'users', data.clientId));
        const providerSnap = await getDoc(doc(db, 'users', data.providerId));
        
        setCaseData({ 
          id: docSnap.id, 
          ...data,
          client: clientSnap.exists() ? clientSnap.data() : null,
          provider: providerSnap.exists() ? providerSnap.data() : null,
        });
      } else {
        console.error("Case not found");
        setCaseData(null);
      }
      setLoading(false);
    });

    const commentsQuery = query(collection(db, `cases/${caseId}/comments`), orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
        const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() } as Comment));
        setComments(fetchedComments);
    });
    
    const investmentsQuery = query(collection(db, 'investments'), where('caseId', '==', caseId));
    const unsubscribeInvestments = onSnapshot(investmentsQuery, (snapshot) => {
        const fetchedInvestments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
        setInvestments(fetchedInvestments);
    });

    return () => {
      unsubscribeCase();
      unsubscribeComments();
      unsubscribeInvestments();
    };
  }, [caseId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!caseData || newStatus === caseData.status) return;

    try {
        await runTransaction(db, async (transaction) => {
            const caseRef = doc(db, 'cases', caseId);
            transaction.update(caseRef, { status: newStatus, lastUpdate: serverTimestamp() });

            if (newStatus === 'completed') {
                const sentimentResult = await analyzeCaseSentiment({
                  caseTitle: caseData.title,
                  comments: comments.map(c => ({ authorName: c.authorName, text: c.text })),
                });
                
                let creditReward = 0;
                let toastDescription = '';
                
                switch (sentimentResult.sentiment) {
                    case 'Positivo':
                        creditReward = 10;
                        toastDescription = '¡Excelente colaboración! Créditos de recompensa distribuidos.';
                        break;
                    case 'Neutral':
                        creditReward = 5;
                        toastDescription = 'Caso completado. Se han distribuido créditos de recompensa reducidos.';
                        break;
                    default:
                        creditReward = 0;
                        toastDescription = 'Caso completado, pero no se otorgan créditos debido a la fricción en la comunicación. Fomentemos el respeto.';
                        break;
                }

                if (creditReward > 0) {
                  const clientRef = doc(db, 'users', caseData.clientId);
                  const providerRef = doc(db, 'users', caseData.providerId);
                  transaction.update(clientRef, { credits: increment(creditReward) });
                  transaction.update(providerRef, { credits: increment(creditReward) });
                }

                for (const investment of investments) {
                    const investorRef = doc(db, 'users', investment.investorId);
                    const returnAmount = investment.amount * 1.10; // 10% bonus
                    transaction.update(investorRef, { credits: increment(returnAmount) });
                }

                 toast({ title: '¡Caso Completado!', description: toastDescription });
            }
        });

        toast({ title: 'Success', description: 'Case status updated.' });
        if (newStatus === 'completed') {
            await refreshUserProfile();
        }
    } catch (error) {
        console.error("Error updating status: ", error);
        toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
};

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !userProfile) return;
    
    const commentToAdd = newComment;
    setNewComment('');

    try {
        await addDoc(collection(db, `cases/${caseId}/comments`), {
            text: commentToAdd,
            authorId: user.uid,
            authorName: userProfile.displayName || 'Anonymous',
            authorPhotoURL: userProfile.photoURL || '',
            createdAt: serverTimestamp(),
        });
        
        await updateDoc(doc(db, 'cases', caseId), { lastUpdate: serverTimestamp() });

    } catch (error) {
        console.error("Error adding comment: ", error);
        toast({ title: 'Error', description: 'Failed to add comment.', variant: 'destructive' });
        setNewComment(commentToAdd); // Re-set the comment if sending failed
    }
  };

  const handleSentimentAnalysis = async () => {
    if (!caseData || comments.length === 0) {
      toast({ title: 'No hay suficientes datos', description: 'Se necesita al menos un comentario para analizar el sentimiento.', variant: 'destructive' });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeCaseSentiment({
        caseTitle: caseData.title,
        comments: comments.map(c => ({ authorName: c.authorName, text: c.text })),
      });
      setAnalysisResult(result);
      toast({ title: 'Análisis Completado', description: 'Oniara ha evaluado la conversación.' });
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      toast({ title: 'Error de Análisis', description: 'No se pudo analizar el sentimiento del caso.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

    const handleInvestment = async () => {
        if (!user || !caseData || investmentAmount <= 0) return;
        if ((userProfile?.credits || 0) < investmentAmount) {
            toast({ title: 'Fondos Insuficientes', description: 'No tienes suficientes créditos para esta inversión.', variant: 'destructive' });
            return;
        }
        setIsInvesting(true);
        try {
            const result = await processInvestment({
                investorId: user.uid,
                caseId: caseData.id,
                amount: investmentAmount,
            });

            if (result.success) {
                toast({ title: 'Inversión Exitosa', description: result.message });
                await refreshUserProfile();
                setIsInvestmentDialogOpen(false);
                setInvestmentAmount(0);
            } else {
                toast({ title: 'Error en la Inversión', description: result.message, variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'No se pudo completar la inversión.', variant: 'destructive' });
        } finally {
            setIsInvesting(false);
        }
    };


  const SentimentIcon = ({ sentiment }: { sentiment: CaseSentimentOutput['sentiment'] }) => {
    switch (sentiment) {
      case 'Positivo': return <ThumbsUp className="h-5 w-5 text-green-500" />;
      case 'Negativo': return <Frown className="h-5 w-5 text-red-500" />;
      case 'Conflicto Potencial': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'Neutral': default: return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) return <div>Loading case details...</div>;
  if (!caseData) return <div>Case not found.</div>;

  const isParticipant = user?.uid === caseData.clientId || user?.uid === caseData.providerId;
  const clientWhatsappMessage = encodeURIComponent(`Hola ${caseData.client?.displayName}, te contacto desde AFKEcosystem sobre el caso: "${caseData.title}".`);
  const providerWhatsappMessage = encodeURIComponent(`Hola ${caseData.provider?.displayName}, te contacto desde AFKEcosystem sobre el caso: "${caseData.title}".`);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">{caseData.title}</CardTitle>
              <CardDescription>
                Caso creado el {format(caseData.createdAt.toDate(), 'PPP')}
              </CardDescription>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-4">
              <Select onValueChange={handleStatusChange} defaultValue={caseData.status}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="in-progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StatusTracker currentStatus={caseData.status} />
          <Separator className="my-6" />
          <p className="text-muted-foreground">{caseData.description}</p>
          <Separator className="my-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
                <h4 className="font-semibold">Cliente</h4>
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${caseData.client?.uid}`} className="group"><Avatar><AvatarImage src={caseData.client?.photoURL} /><AvatarFallback>{caseData.client?.displayName?.[0] || 'C'}</AvatarFallback></Avatar></Link>
                    <div>
                        <Link href={`/profile/${caseData.client?.uid}`}><p className="font-medium hover:underline">{caseData.client?.displayName}</p></Link>
                        <p className="text-sm text-muted-foreground">{caseData.client?.email}</p>
                    </div>
                </div>
                 {caseData.client?.phoneNumber && <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${caseData.client.phoneNumber.replace(/\D/g, '')}?text=${clientWhatsappMessage}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon />Contactar Cliente</a></Button>}
            </div>
             <div className="space-y-3">
                <h4 className="font-semibold">Proveedor</h4>
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${caseData.provider?.uid}`} className="group"><Avatar><AvatarImage src={caseData.provider?.photoURL} /><AvatarFallback>{caseData.provider?.displayName?.[0] || 'P'}</AvatarFallback></Avatar></Link>
                    <div>
                        <Link href={`/profile/${caseData.provider?.uid}`}><p className="font-medium hover:underline">{caseData.provider?.displayName}</p></Link>
                        <p className="text-sm text-muted-foreground">{caseData.provider?.email}</p>
                    </div>
                </div>
                {caseData.provider?.phoneNumber && <Button asChild variant="outline" size="sm"><a href={`https://wa.me/${caseData.provider.phoneNumber.replace(/\D/g, '')}?text=${providerWhatsappMessage}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon />Contactar Proveedor</a></Button>}
            </div>
          </div>
        </CardContent>
      </Card>
        
      <Card>
        <CardHeader><CardTitle>Inversiones del Ecosistema</CardTitle></CardHeader>
        <CardContent>
            <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                <div>
                    <p className="text-muted-foreground">Total Invertido</p>
                    <p className="text-2xl font-bold">{totalInvested.toLocaleString()} créditos</p>
                </div>
                {!isParticipant && (
                    <Dialog open={isInvestmentDialogOpen} onOpenChange={setIsInvestmentDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><HandCoins className="mr-2 h-4 w-4" />Invertir</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invertir en: {caseData.title}</DialogTitle>
                                <DialogDescription>Tu balance actual: {userProfile?.credits || 0} créditos. Recibirás un 10% de retorno si el caso se completa exitosamente.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="investment-amount">Monto a Invertir</Label>
                                <Input id="investment-amount" type="number" value={investmentAmount} onChange={(e) => setInvestmentAmount(Number(e.target.value))} min="1" max={userProfile?.credits || 0} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                <Button onClick={handleInvestment} disabled={isInvesting || investmentAmount <= 0}>{isInvesting ? "Invirtiendo..." : "Confirmar Inversión"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <div className="mt-4 space-y-2">
                {investments.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between text-sm">
                        <p>Inversión de {inv.investorId}</p>
                        <p className="font-semibold">{inv.amount.toLocaleString()} créditos</p>
                    </div>
                ))}
                {investments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aún no hay inversiones en este caso.</p>}
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Comentarios</CardTitle>
                <Button variant="outline" onClick={handleSentimentAnalysis} disabled={isAnalyzing}>
                    <Bot className="mr-2 h-4 w-4" />
                    {isAnalyzing ? 'Analizando...' : 'Analizar Sentimiento'}
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          {analysisResult && (
            <Card className="mb-6 bg-secondary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <SentimentIcon sentiment={analysisResult.sentiment} />
                  Análisis de Oniara: {analysisResult.sentiment}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="italic text-muted-foreground">{analysisResult.summary}</p>
                {analysisResult.keyPositivePoints && analysisResult.keyPositivePoints.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-600">Puntos Positivos:</h4>
                    <ul className="list-disc pl-5">
                      {analysisResult.keyPositivePoints.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                  </div>
                )}
                {analysisResult.keyNegativePoints && analysisResult.keyNegativePoints.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-600">Puntos de Fricción:</h4>
                    <ul className="list-disc pl-5">
                      {analysisResult.keyNegativePoints.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4 max-h-96 overflow-y-auto p-4 border rounded-lg bg-muted/20">
            {comments.length > 0 ? comments.map(comment => (
              <div key={comment.id} className={cn(
                  "flex items-end gap-2",
                  comment.authorId === user?.uid ? "justify-end" : "justify-start"
              )}>
                {comment.authorId !== user?.uid && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.authorPhotoURL} />
                        <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                    </Avatar>
                )}
                <div className={cn(
                    "max-w-xs md:max-w-md rounded-lg p-3",
                    comment.authorId === user?.uid
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                )}>
                    <p className="text-sm font-semibold">{comment.authorId === user?.uid ? 'Tú' : comment.authorName}</p>
                    <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                    <p className="text-xs opacity-70 mt-1 text-right">
                        {comment.createdAt ? format(comment.createdAt, 'p, dd/MM/yy') : '...'}
                    </p>
                </div>
                 {comment.authorId === user?.uid && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.authorPhotoURL} />
                        <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                    </Avatar>
                )}
              </div>
            )) : (
                <p className="text-center text-muted-foreground py-4">No hay comentarios aún. ¡Inicia la conversación!</p>
            )}
          </div>
          <form onSubmit={handleAddComment} className="mt-4 flex items-center gap-2">
            <Textarea
              placeholder="Escribe tu comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-grow"
              rows={1}
            />
            <Button type="submit" disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
