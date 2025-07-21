// src/modules/cases/components/case-detail.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, orderBy, addDoc, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { Case, Comment } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';


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
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const getStatusVariant = useCallback((status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'in-progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  }, []);

  useEffect(() => {
    if (!caseId) return;
    setLoading(true);
    const caseRef = doc(db, 'cases', caseId);

    const unsubscribeCase = onSnapshot(caseRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Case, 'id'>;
        
        // Fetch client and provider profiles
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
        const fetchedComments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
            } as Comment
        });
        setComments(fetchedComments);
    });

    return () => {
      unsubscribeCase();
      unsubscribeComments();
    };
  }, [caseId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!caseData || newStatus === caseData.status) return;
    
    try {
        await runTransaction(db, async (transaction) => {
            const caseRef = doc(db, 'cases', caseId);
            const caseDoc = await transaction.get(caseRef);
            if (!caseDoc.exists()) throw "Case does not exist!";

            // Update case status and timestamp
            transaction.update(caseRef, { status: newStatus, lastUpdate: serverTimestamp() });

            // If case is completed, award credits
            if (newStatus === 'completed') {
                const clientRef = doc(db, 'users', caseData.clientId);
                const providerRef = doc(db, 'users', caseData.providerId);
                
                // Award 10 credits to both client and provider
                transaction.update(clientRef, { credits: increment(10) });
                transaction.update(providerRef, { credits: increment(10) });
            }
        });
        
        toast({ title: 'Success', description: 'Case status updated.' });
         if (newStatus === 'completed') {
            toast({ title: '¡Créditos Ganados!', description: '¡Cliente y proveedor han ganado 10 créditos cada uno!' });
        }
    } catch (error) {
        console.error("Error updating status: ", error);
        toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
};

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !userProfile) return;
    
    try {
        await addDoc(collection(db, `cases/${caseId}/comments`), {
            text: newComment,
            authorId: user.uid,
            authorName: userProfile.displayName || 'Anonymous',
            authorPhotoURL: userProfile.photoURL || '',
            createdAt: serverTimestamp(),
        });
        setNewComment('');
        toast({ title: 'Comment added' });
        
        // Also update the case's lastUpdate timestamp
        await updateDoc(doc(db, 'cases', caseId), {
            lastUpdate: serverTimestamp(),
        });

    } catch (error) {
        console.error("Error adding comment: ", error);
        toast({ title: 'Error', description: 'Failed to add comment.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div>Loading case details...</div>;
  }

  if (!caseData) {
    return <div>Case not found.</div>;
  }

  const perspective = user?.uid === caseData.clientId ? 'client' : 'provider';
  const otherParty = perspective === 'client' ? caseData.provider : caseData.client;
  const whatsappMessage = encodeURIComponent(`Hola, te contacto desde AFKEcosystem sobre el caso: "${caseData.title}".`);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">{caseData.title}</CardTitle>
              <CardDescription>
                Case created on {format(caseData.createdAt.toDate(), 'PPP')}
              </CardDescription>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-4">
              <Select onValueChange={handleStatusChange} defaultValue={caseData.status}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                <h4 className="font-semibold">Client</h4>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={caseData.client?.photoURL} />
                        <AvatarFallback>{caseData.client?.displayName?.[0] || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{caseData.client?.displayName}</p>
                        <p className="text-sm text-muted-foreground">{caseData.client?.email}</p>
                    </div>
                </div>
                 {caseData.client?.phoneNumber && (
                    <Button asChild variant="outline" size="sm">
                       <a href={`https://wa.me/${caseData.client.phoneNumber.replace(/\D/g, '')}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer">
                           <WhatsAppIcon />
                           Contactar Cliente
                       </a>
                    </Button>
                )}
            </div>
             <div className="space-y-3">
                <h4 className="font-semibold">Provider</h4>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={caseData.provider?.photoURL} />
                        <AvatarFallback>{caseData.provider?.displayName?.[0] || 'P'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{caseData.provider?.displayName}</p>
                        <p className="text-sm text-muted-foreground">{caseData.provider?.email}</p>
                    </div>
                </div>
                {caseData.provider?.phoneNumber && (
                    <Button asChild variant="outline" size="sm">
                       <a href={`https://wa.me/${caseData.provider.phoneNumber.replace(/\D/g, '')}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer">
                           <WhatsAppIcon />
                           Contactar Proveedor
                       </a>
                    </Button>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3">
                 <Avatar className="h-9 w-9">
                    <AvatarImage src={comment.authorPhotoURL} />
                    <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">{comment.authorName}</p>
                        <p className="text-xs text-muted-foreground">
                            {comment.createdAt ? format(comment.createdAt, 'PPp') : '...'}
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                </div>
              </div>
            ))}
             {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No comments yet.</p>
            )}
          </div>
          <Separator className="my-6" />
           <div className="space-y-2">
            <Textarea
              placeholder="Add your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Add Comment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
