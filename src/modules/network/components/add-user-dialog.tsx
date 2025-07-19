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
  const [identifier, setIdentifier] = useState(''); // Can be email or phone
  const [loading, setLoading] = useState(false);

  const handleAddUser = async () => {
    if (!identifier.trim() || !user) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email or phone number.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    try {
      // Determine if the identifier is an email or a phone number
      const isEmail = identifier.includes('@');
      const fieldToQuery = isEmail ? 'email' : 'phoneNumber';

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where(fieldToQuery, '==', identifier.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: 'Not Found',
          description: `No user found with this ${isEmail ? 'email' : 'phone number'}.`,
          variant: 'destructive',
        });
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
        return;
      }

      const currentUserRef = doc(db, 'users', user.uid);
      const otherUserRef = doc(db, 'users', foundUserId);
      
      const fieldForCurrentUser = roleToAdd === 'provider' ? 'network.providers' : 'network.clients';
      const fieldForOtherUser = roleToAdd === 'provider' ? 'network.clients' : 'network.providers';

      // Check if user is already in the network
      const currentUserSnap = await getDoc(currentUserRef);
      const currentUserData = currentUserSnap.data();
      const existingNetwork = roleToAdd === 'provider' ? currentUserData?.network?.providers : currentUserData?.network?.clients;

      if (existingNetwork && existingNetwork.includes(foundUserId)) {
        toast({
          title: 'Already exists',
          description: `This user is already in your ${roleToAdd} list.`,
        });
        return;
      }


      // Update current user's document
      await updateDoc(currentUserRef, {
        [fieldForCurrentUser]: arrayUnion(foundUserId),
      });

      // Update the other user's document to establish the two-way connection
      await updateDoc(otherUserRef, {
          [fieldForOtherUser]: arrayUnion(user.uid),
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
            Enter the email or phone number of the user you want to add to your
            network. They must already have an account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="identifier" className="text-right">
              Email/Phone
            </Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="col-span-3"
              placeholder="user@example.com or +1..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleadd}>
            Add a client
          </Button>
          <Button onClick={handleAddUser} disabled={loading}>
            {loading ? 'Adding...' : `Add ${roleToAdd}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
