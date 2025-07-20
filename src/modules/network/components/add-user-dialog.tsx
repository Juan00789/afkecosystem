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

      if (trimmedIdentifier.includes('@')) {
        fieldToQuery = 'email';
        q = query(collection(db, 'users'), where(fieldToQuery, '==', trimmedIdentifier));
      } else if (trimmedIdentifier.match(/^\+?[0-9\s-()]+$/)) {
        fieldToQuery = 'phoneNumber';
         q = query(collection(db, 'users'), where(fieldToQuery, '==', trimmedIdentifier));
      } else {
        fieldToQuery = 'User ID';
        q = query(collection(db, 'users'), where(documentId(), '==', trimmedIdentifier));
      }

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: 'Not Found',
          description: `No user found with this ${fieldToQuery}.`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const foundUserDoc = querySnapshot.docs[0];
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
        if (!currentUserSnap.exists()) throw "Current user not found!";
        
        const currentUserData = currentUserSnap.data();
        const network = currentUserData.network || {};
        const isFirstConnection = (roleToAdd === 'client' && !network.clients?.length) || (roleToAdd === 'provider' && !network.providers?.length);
        
        const fieldForCurrentUser = roleToAdd === 'provider' ? 'network.providers' : 'network.clients';
        const fieldForOtherUser = roleToAdd === 'provider' ? 'network.clients' : 'network.providers';

        const existingNetwork = network?.[fieldForCurrentUser.split('.')[1]] || [];
        if (existingNetwork.includes(foundUserId)) {
            toast({
              title: 'Already exists',
              description: `This user is already in your ${roleToAdd}s list.`,
            });
            return;
        }

        // Update both users' networks
        transaction.update(currentUserRef, { [fieldForCurrentUser]: arrayUnion(foundUserId) });
        transaction.update(otherUserRef, { [fieldForOtherUser]: arrayUnion(user.uid) });

        if (isFirstConnection) {
            transaction.update(currentUserRef, { credits: increment(5) });
            toast({
                title: '¡Créditos Ganados!',
                description: `Has ganado 5 créditos por añadir tu primer ${roleToAdd}.`,
            });
        }
      });


      toast({
        title: 'Success!',
        description: `User has been added as a ${roleToAdd}.`,
      });
      onUserAdded();
      setIsOpen(false);
      setIdentifier('');

    } catch (error) {
      console.error(`Error adding ${roleToAdd}:`, error);
      toast({
        title: 'Error',
        description: `There was a problem adding the user.`,
        variant: 'destructive',
      });
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
