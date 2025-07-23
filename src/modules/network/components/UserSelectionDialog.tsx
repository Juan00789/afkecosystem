// src/modules/network/components/UserSelectionDialog.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, increment, limit, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import type { UserProfile } from '@/modules/auth/types';
import { UserPlus, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserSelectionDialogProps {
  roleToAdd: 'client' | 'provider';
  existingNetworkIds: string[];
  onUserAdded: () => void;
}

export function UserSelectionDialog({ roleToAdd, existingNetworkIds, onUserAdded }: UserSelectionDialogProps) {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersList = usersSnapshot.docs
                .map(doc => doc.data() as UserProfile)
                .filter(p => p.uid !== user.uid && !existingNetworkIds.includes(p.uid)); // Exclude self and existing connections
            setAllUsers(usersList);
        } catch (error) {
            console.error("Error fetching all users:", error);
            toast({ title: 'Error', description: 'Could not load users list.', variant: 'destructive'});
        } finally {
            setLoading(false);
        }
    };
    
    fetchAllUsers();
  }, [isOpen, user, existingNetworkIds, toast]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers;
    return allUsers.filter(u => 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allUsers]);

  const handleAddUser = async (userToAdd: UserProfile) => {
    if (!user || !userProfile) {
      toast({ title: 'Error', description: 'Please log in again.', variant: 'destructive' });
      return;
    }
    
    const clientId = roleToAdd === 'provider' ? user.uid : userToAdd.uid;
    const providerId = roleToAdd === 'provider' ? userToAdd.uid : user.uid;
    
    try {
        await runTransaction(db, async (transaction) => {
            const fieldToCheck = roleToAdd === 'client' ? 'client_id' : 'provider_id';
            const valueToCheck = roleToAdd === 'client' ? userToAdd.uid : user.uid;

            const connectionsQuery = query(
                collection(db, 'network_connections'),
                where(fieldToCheck, '==', valueToCheck),
                limit(1)
            );
            
            const existingConnectionsSnap = await getDocs(connectionsQuery);
            const isFirstConnectionOfType = existingConnectionsSnap.empty;
            
            // Add the new connection
            const newConnectionRef = doc(collection(db, 'network_connections'));
            transaction.set(newConnectionRef, {
              client_id: clientId,
              provider_id: providerId,
              created_at: serverTimestamp(),
            });

            // Award credits if it's the first connection of this type
            if (isFirstConnectionOfType) {
                const currentUserRef = doc(db, 'users', user.uid);
                transaction.update(currentUserRef, { credits: increment(5) });
                toast({
                    title: '¡Créditos Ganados!',
                    description: `Has ganado 5 créditos por añadir tu primer ${roleToAdd}.`
                });
            }
        });
        
        toast({ title: '¡Éxito!', description: `${userToAdd.displayName} ha sido añadido como tu ${roleToAdd}.` });
        
        // Refresh local and global state
        onUserAdded();
        await refreshUserProfile();
        setIsOpen(false);

    } catch (error) {
        console.error("Error adding user to network:", error);
        toast({ title: 'Error', description: 'Failed to add user.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Añadir {roleToAdd}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir un nuevo {roleToAdd}</DialogTitle>
          <DialogDescription>Selecciona un usuario de la plataforma para añadir a tu red.</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por nombre o correo..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <ScrollArea className="h-72 mt-4">
            <div className="space-y-2 pr-4">
            {loading ? <p>Cargando usuarios...</p> : filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                    <div key={u.uid} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={u.photoURL} />
                                <AvatarFallback>{u.displayName?.[0] || u.email[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{u.displayName}</p>
                                <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                        </div>
                        <Button size="sm" onClick={() => handleAddUser(u)}>Añadir</Button>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground py-10">No se encontraron usuarios.</p>
            )}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
