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
import { Trash2, MessageSquare } from 'lucide-react';
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

const WhatsAppIcon = () => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M12.04 2.016c-5.49 0-9.957 4.467-9.957 9.957 0 1.906.538 3.696 1.487 5.25L2.015 22l4.904-1.556a9.88 9.88 0 0 0 4.982 1.32c5.49 0 9.956-4.467 9.956-9.957s-4.466-9.957-9.956-9.957zm0 18.15c-1.636 0-3.23-.42-4.62-1.205l-.33-.195-3.434.91.927-3.356-.214-.348a8.35 8.35 0 0 1-1.26-4.96c0-4.54 3.704-8.244 8.244-8.244s8.244 3.704 8.244 8.244-3.704 8.244-8.244 8.244zm4.512-6.136c-.247-.124-1.463-.722-1.69- .808-.226-.086-.39-.124-.555.124-.164.247-.638.808-.782.972-.144.165-.288.185-.535.062-.247-.124-.927-.34-1.767-1.09s-1.402-1.636-1.402-1.928c0-.29.313-.446.425-.554.112-.108.247-.287.37-.47.124-.184.165-.307.247-.514.082-.206.04-.385-.02-.51-.06-.124-.555-1.33-.76-1.822-.206-.49-.413-.422-.555-.43-.144-.007-.308-.007-.472-.007a.95.95 0 0 0-.68.307c-.226.247-.873.85-1.07 2.06s-.206 2.223.04 2.514c.247.29 1.424 2.223 3.456 3.036 2.032.813 2.032.544 2.398.514.367-.03.928-.38 1.05- .74.124-.36.124-.67.082-.81z" />
    </svg>
);

interface NetworkListProps {
  refreshTrigger: number;
  onUserRemoved: () => void;
}

export function NetworkList({ refreshTrigger, onUserRemoved }: NetworkListProps) {
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
        const connectionsQuery = query(collection(db, 'network_connections'), where('client_id', '==', user.uid));
        const connectionsSnapshot = await getDocs(connectionsQuery);
        const providerIds = connectionsSnapshot.docs.map(doc => doc.data().provider_id);

        if (providerIds.length > 0) {
          const usersQuery = query(collection(db, 'users'), where('uid', 'in', providerIds));
          const usersSnapshot = await getDocs(usersQuery);
          const usersList = usersSnapshot.docs.map(docSnap => docSnap.data() as UserProfile);
          setUsers(usersList);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error(`Error fetching network:`, error);
        toast({ title: 'Error', description: `Failed to load network.`, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkUsers();
  }, [user, refreshTrigger, toast]);

  const handleRemoveUser = async (userToRemoveId: string) => {
    if (!user) return;
    
    try {
        // Query for both directions of the connection
        const q1 = query(collection(db, 'network_connections'), where('client_id', '==', user.uid), where('provider_id', '==', userToRemoveId));
        const q2 = query(collection(db, 'network_connections'), where('client_id', '==', userToRemoveId), where('provider_id', '==', user.uid));

        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        if (snapshot1.empty && snapshot2.empty) {
            throw new Error("Connection not found.");
        }
        
        const batch = writeBatch(db);
        snapshot1.docs.forEach(doc => batch.delete(doc.ref));
        snapshot2.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        toast({ title: 'Success', description: 'User removed from your network.' });
        onUserRemoved(); // Trigger a refresh in the parent component

    } catch (error) {
        console.error('Error removing user:', error);
        toast({ title: 'Error', description: 'Failed to remove user.', variant: 'destructive' });
    }
  }

  if (loading) {
    return <p>Cargando tu red...</p>;
  }

  return (
    <div>
      {users.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Compañía</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((networkUser) => {
              const whatsappNumber = networkUser.phoneNumber?.replace(/\D/g, '');
              const whatsappLink = whatsappNumber 
                ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, te contacto desde AFKEcosystem.`)}`
                : null;

              return (
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
                <TableCell>{networkUser.companyName || 'Independiente'}</TableCell>
                <TableCell>{networkUser.email || networkUser.phoneNumber || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  {whatsappLink && (
                    <Button asChild variant="outline" size="sm" className="mr-2">
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                          <WhatsAppIcon />
                      </a>
                    </Button>
                  )}
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
                          This action will remove {networkUser.displayName || 'this user'} from your network.
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
            )})}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Tu red de brokis está vacía. ¡Añade tu primer contacto!</p>
        </div>
      )}
    </div>
  );
}
