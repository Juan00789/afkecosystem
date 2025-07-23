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
  writeBatch,
  serverTimestamp,
  increment,
  documentId,
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
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddUser = async () => {
    if (!identifier.trim() || !user || !userProfile) {
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
      const queries = [
        query(collection(db, 'users'), where('email', '==', trimmedIdentifier)),
        query(collection(db, 'users'), where('phoneNumber', '==', trimmedIdentifier)),
      ];
      if (trimmedIdentifier.length > 10 && !trimmedIdentifier.includes('@')) {
        queries.push(query(collection(db, 'users'), where(documentId(), '==', trimmedIdentifier)));
      }

      let foundUserDoc = null;
      for (const q of queries) {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          foundUserDoc = querySnapshot.docs[0];
          break;
        }
      }

      if (!foundUserDoc) {
        throw new Error('No user found with the provided identifier.');
      }

      const foundUserId = foundUserDoc.id;
      if (foundUserId === user.uid) {
        throw new Error('You cannot add yourself to your network.');
      }
      
      const clientId = roleToAdd === 'provider' ? user.uid : foundUserId;
      const providerId = roleToAdd === 'provider' ? foundUserId : user.uid;

      // Check if this connection already exists
      const connectionQuery = query(
        collection(db, 'network_connections'),
        where('client_id', '==', clientId),
        where('provider_id', '==', providerId)
      );
      const existingConnection = await getDocs(connectionQuery);
      if (!existingConnection.empty) {
        throw new Error(`This user is already in your ${roleToAdd}s list.`);
      }

      // Check if this is the first connection of this type for the current user
       const firstOfTypeQuery = query(
         collection(db, 'network_connections'),
         where(roleToAdd === 'provider' ? 'client_id' : 'provider_id', '==', user.uid)
       );
       const firstOfTypeSnapshot = await getDocs(firstOfTypeQuery);
       const isFirstConnectionOfType = firstOfTypeSnapshot.empty;

      // Use a batch write
      const batch = writeBatch(db);

      // Create the new connection document
      const newConnectionRef = doc(collection(db, 'network_connections'));
      batch.set(newConnectionRef, {
        client_id: clientId,
        provider_id: providerId,
        created_at: serverTimestamp(),
      });

      // Award credits if it's the first connection of this type
      if (isFirstConnectionOfType) {
        const currentUserRef = doc(db, 'users', user.uid);
        batch.update(currentUserRef, { credits: increment(5) });
      }

      await batch.commit();
      
      toast({ title: '¡Éxito!', description: `User has been added as a ${roleToAdd}.` });
      if (isFirstConnectionOfType) {
        toast({ title: '¡Créditos Ganados!', description: `Has ganado 5 créditos por añadir tu primer ${roleToAdd}.` });
        await refreshUserProfile();
      }

      onUserAdded();
      setIsOpen(false);
      setIdentifier('');

    } catch (error: any) {
      console.error(`Error adding ${roleToAdd}:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to add ${roleToAdd}.`,
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
