// src/modules/network/components/network-list.tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
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
import Link from 'next/link';

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
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const fieldToQuery = roleToList === 'provider' ? 'client_id' : 'provider_id';
        const connectionsQuery = query(collection(db, 'network_connections'), where(fieldToQuery, '==', user.uid));
        const connectionsSnapshot = await getDocs(connectionsQuery);

        const userIds = connectionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return roleToList === 'provider' ? data.provider_id : data.client_id;
        });

        if (userIds.length > 0) {
          const usersQuery = query(collection(db, 'users'), where('uid', 'in', userIds));
          const usersSnapshot = await getDocs(usersQuery);
          const usersList = usersSnapshot.docs.map(docSnap => docSnap.data() as UserProfile);
          setUsers(usersList);
        } else {
          setUsers([]);
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
        const clientId = roleToList === 'provider' ? user.uid : userToRemoveId;
        const providerId = roleToList === 'provider' ? userToRemoveId : user.uid;

        const connectionQuery = query(
            collection(db, 'network_connections'),
            where('client_id', '==', clientId),
            where('provider_id', '==', providerId)
        );
        const snapshot = await getDocs(connectionQuery);
        
        if (snapshot.empty) {
            throw new Error("Connection not found.");
        }
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

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
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Rol / Compañía</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
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
                     <Link href={`/profile/${networkUser.uid}`} className="font-medium hover:underline">
                        {networkUser.displayName || 'N/A'}
                    </Link>
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
                          This action will remove {networkUser.displayName || 'this user'} from your {roleToList} list.
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
