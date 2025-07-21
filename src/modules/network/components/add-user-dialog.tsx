// src/modules/network/components/add-user-dialog.tsx
'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  documentId,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { Role } from '@/modules/auth/types';
import { UserPlus } from 'lucide-react';

interface AddUserDialogProps {
  roleToAdd: 'client' | 'provider';
  onUserAdded: () => void;
}

export function AddUserDialog({ roleToAdd, onUserAdded }: AddUserDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddUser = async () => {
    if (!identifier.trim() || !user) {
      toast({
        title: 'Error',
        description: 'Please enter a valid User ID, email, or phone number.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    try {
      const trimmedIdentifier = identifier.trim();
      let q;
      let fieldToQuery: string;

      // Create queries for different identifier types
      const queries = [
          query(collection(db, 'users'), where('email', '==', trimmedIdentifier)),
          query(collection(db, 'users'), where('phoneNumber', '==', trimmedIdentifier)),
          query(collection(db, 'users'), where(documentId(), '==', trimmedIdentifier)),
      ];

      let foundUserDoc = null;
      for (const q of queries) {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              foundUserDoc = querySnapshot.docs[0];
              break;
          }
      }


      if (!foundUserDoc) {
        toast({
          title: 'Not Found',
          description: `No user found with the provided identifier.`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const foundUserId = foundUserDoc.id;

      if (foundUserId === user.uid) {
        toast({
          title: 'Error',
          description: "You cannot add yourself to your network.",
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      await runTransaction(db, async (transaction) => {
        const currentUserRef = doc(db, 'users', user.uid);
        const otherUserRef = doc(db, 'users', foundUserId);
        
        const currentUserSnap = await transaction.get(currentUserRef);
        const otherUserSnap = await transaction.get(otherUserRef);

        if (!currentUserSnap.exists() || !otherUserSnap.exists()) {
             throw new Error("One or both users could not be found.");
        }
        
        const currentUserData = currentUserSnap.data();
        const network = currentUserData.network || {}; // Ensure network object exists
        const clients = network.clients || [];
        const providers = network.providers || [];

        const isProvider = roleToAdd === 'provider';
        const listToCheck = isProvider ? providers : clients;

        if (listToCheck.includes(foundUserId)) {
             toast({
              title: 'Already exists',
              description: `This user is already in your ${roleToAdd}s list.`,
            });
            // Stop the transaction by returning early.
            return;
        }

        const isFirstConnection = listToCheck.length === 0;

        if (isProvider) {
          transaction.update(currentUserRef, { 'network.providers': arrayUnion(foundUserId) });
          transaction.update(otherUserRef, { 'network.clients': arrayUnion(user.uid) });
        } else {
          transaction.update(currentUserRef, { 'network.clients': arrayUnion(foundUserId) });
          transaction.update(otherUserRef, { 'network.providers': arrayUnion(user.uid) });
        }
        
        // Award credits only if this is the first time adding a user of this type
        const hasProviders = providers.length > 0;
        const hasClients = clients.length > 0;

        if ((isProvider && !hasProviders) || (!isProvider && !hasClients)) {
             transaction.update(currentUserRef, { credits: increment(5) });
             toast({
                 title: '¡Créditos Ganados!',
                 description: `Has ganado 5 créditos por añadir tu primer ${roleToAdd}.`,
             });
        }
      });

      // Check if a specific toast was already shown (like 'Already exists') before showing the generic success one
      const wasSpecificErrorToastShown = toast.toasts.some(t => t.title === 'Already exists');
      if (!wasSpecificErrorToastShown) {
         toast({
            title: 'Success!',
            description: `User has been added as a ${roleToAdd}.`,
          });
      }

      onUserAdded();
      setIsOpen(false);
      setIdentifier('');

    } catch (error: any) {
      console.error(`Error adding ${roleToAdd}:`, error);
      const wasSpecificErrorToastShown = toast.toasts.some(t => 
        t.title === 'Already exists' || t.title === '¡Créditos Ganados!'
      );
      if (!wasSpecificErrorToastShown) {
         toast({
          title: 'Error',
          description: error.message || `Failed to add ${roleToAdd}.`,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Add {roleToAdd === 'provider' ? 'Provider' : 'Client'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a new {roleToAdd}</DialogTitle>
          <DialogDescription>
            Enter the User ID, email, or phone number of the user you want to add.
            They must already have an account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="identifier" className="text-right">
              ID/Email/Phone
            </Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="col-span-3"
              placeholder="User ID, email, or phone"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddUser} disabled={loading}>
            {loading ? 'Adding...' : `Add ${roleToAdd}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
