// src/modules/network/components/network-management.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserSelectionDialog } from './UserSelectionDialog';
import { NetworkList } from './network-list';
import { Users, Briefcase } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function NetworkManagement() {
  const { user, refreshUserProfile } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [providerIds, setProviderIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchConnections = async () => {
      // Fetch clients
      const clientsQuery = query(collection(db, 'network_connections'), where('provider_id', '==', user.uid));
      const clientsSnapshot = await getDocs(clientsQuery);
      setClientIds(clientsSnapshot.docs.map(doc => doc.data().client_id));

      // Fetch providers
      const providersQuery = query(collection(db, 'network_connections'), where('client_id', '==', user.uid));
      const providersSnapshot = await getDocs(providersQuery);
      setProviderIds(providersSnapshot.docs.map(doc => doc.data().provider_id));
    };

    fetchConnections();
  }, [user, refreshTrigger]);

  const handleUserAddedOrRemoved = () => {
    setRefreshTrigger(prev => prev + 1);
    refreshUserProfile();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Brokis</h1>
        <p className="text-muted-foreground">Tu red de confianza. Conexiones donde los roles fluyen y la colaboración crece.</p>
      </div>

      <div className="space-y-8">
        {/* Clients Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Mis Clientes</CardTitle>
                  <CardDescription>
                    Usuarios que confían en tus servicios.
                  </CardDescription>
                </div>
              </div>
              <UserSelectionDialog 
                roleToAdd="client"
                existingNetworkIds={clientIds}
                onUserAdded={handleUserAddedOrRemoved}
              />
            </div>
          </CardHeader>
          <CardContent>
            <NetworkList 
              roleToList="client"
              refreshTrigger={refreshTrigger}
              onUserRemoved={handleUserAddedOrRemoved}
            />
          </CardContent>
        </Card>

        {/* Providers Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <Briefcase className="h-6 w-6 text-secondary" />
                 <div>
                    <CardTitle>Mis Proveedores</CardTitle>
                    <CardDescription>
                      Expertos que te ayudan a crecer.
                    </CardDescription>
                 </div>
              </div>
              <UserSelectionDialog
                roleToAdd="provider"
                existingNetworkIds={providerIds}
                onUserAdded={handleUserAddedOrRemoved}
              />
            </div>
          </CardHeader>
          <CardContent>
            <NetworkList
              roleToList="provider"
              refreshTrigger={refreshTrigger}
              onUserRemoved={handleUserAddedOrRemoved}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
