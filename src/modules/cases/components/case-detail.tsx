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
              <Badge variant={getStatusVariant(caseData.status)} className="text-lg px-4 py-1">
                {caseData.status}
              </Badge>
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
          <p className="text-muted-foreground">{caseData.description}</p>
          <Separator className="my-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold mb-2">Client</h4>
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
            </div>
             <div>
                <h4 className="font-semibold mb-2">Provider</h4>
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
