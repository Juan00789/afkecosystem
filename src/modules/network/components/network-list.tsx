// src/modules/network/components/network-list.tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, query, where, getDocs, updateDoc, arrayRemove, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { UserProfile } from '@/modules/auth/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';


interface NetworkListProps {
  roleToList: 'client' | 'provider';
  refreshTrigger: number;
  onUserRemoved: () => void;
}

export function NetworkList({ roleToList, refreshTrigger, onUserRemoved }: NetworkListProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNetworkUsers = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const networkField = roleToList === 'provider' ? 'network.providers' : 'network.clients';
          const userIds = userData[networkField.split('.')[0]]?.[networkField.split('.')[1]] || [];

          if (userIds.length > 0) {
            // Fetch each user document individually
            const userPromises = userIds.map((id: string) => getDoc(doc(db, 'users', id)));
            const userDocs = await Promise.all(userPromises);
            const usersList = userDocs
              .filter(docSnap => docSnap.exists())
              .map(docSnap => ({ ...docSnap.data(), uid: docSnap.id } as UserProfile));
            setUsers(usersList);
          } else {
            setUsers([]);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${roleToList}s:`, error);
        toast({ title: 'Error', description: `Failed to load ${roleToList}s.`, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkUsers();
  }, [user, roleToList, refreshTrigger, toast]);

  const handleRemoveUser = async (userToRemoveId: string) => {
    if (!user) return;
    
    try {
        const currentUserRef = doc(db, 'users', user.uid);
        const otherUserRef = doc(db, 'users', userToRemoveId);

        const fieldForCurrentUser = roleToList === 'provider' ? 'network.providers' : 'network.clients';
        const fieldForOtherUser = roleToList === 'provider' ? 'network.clients' : 'network.providers';
        
        // Remove from current user's network
        await updateDoc(currentUserRef, {
            [fieldForCurrentUser]: arrayRemove(userToRemoveId)
        });

        // Remove from the other user's network
         await updateDoc(otherUserRef, {
            [fieldForOtherUser]: arrayRemove(user.uid)
        });

        toast({ title: 'Success', description: 'User removed from your network.' });
        onUserRemoved(); // Trigger a refresh in the parent component

    } catch (error) {
        console.error('Error removing user:', error);
        toast({ title: 'Error', description: 'Failed to remove user.', variant: 'destructive' });
    }
  }


  if (loading) {
    return <p>Loading {roleToList}s...</p>;
  }

  return (
    <div>
      {users.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((networkUser) => (
              <TableRow key={networkUser.uid}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={networkUser.photoURL} />
                      <AvatarFallback>
                        {networkUser.displayName?.[0] || networkUser.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{networkUser.displayName || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>{networkUser.email || networkUser.phoneNumber || 'N/A'}</TableCell>
                <TableCell>{networkUser.companyName || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will remove {networkUser.displayName || 'this user'} from your {roleToList} list. You can add them back later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveUser(networkUser.uid)}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">You haven't added any {roleToList}s yet.</p>
        </div>
      )}
    </div>
  );
}
