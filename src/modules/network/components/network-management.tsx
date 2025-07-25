// src/modules/network/components/network-management.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserSelectionDialog } from './UserSelectionDialog';
import { NetworkList } from './network-list';
import { GitFork } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function NetworkManagement() {
  const { user, refreshUserProfile } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [networkIds, setNetworkIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!user) {
        setNetworkIds([]);
        setLoading(false);
        return;
    };
    setLoading(true);
    try {
        const clientConnectionsQuery = query(collection(db, 'network_connections'), where('provider_id', '==', user.uid));
        const providerConnectionsQuery = query(collection(db, 'network_connections'), where('client_id', '==', user.uid));
        
        const [clientSnapshot, providerSnapshot] = await Promise.all([
            getDocs(clientConnectionsQuery),
            getDocs(providerConnectionsQuery),
        ]);

        const clientIds = clientSnapshot.docs.map(doc => doc.data().client_id);
        const providerIds = providerSnapshot.docs.map(doc => doc.data().provider_id);
        
        const allIds = [...new Set([...clientIds, ...providerIds])];
        setNetworkIds(allIds);
    } catch(error) {
        console.error("Failed to fetch network connections", error);
        setNetworkIds([]);
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [user, refreshTrigger, fetchConnections]);

  const handleUserAddedOrRemoved = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    if(refreshUserProfile) {
      refreshUserProfile();
    }
  }, [refreshUserProfile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Brokis</h1>
        <p className="text-muted-foreground">Tu red de confianza. Conexiones para crecer y colaborar.</p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <GitFork className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Mi Red de Brokis</CardTitle>
                  <CardDescription>
                    Todos los emprendedores con los que has conectado.
                  </CardDescription>
                </div>
              </div>
              <UserSelectionDialog
                existingNetworkIds={networkIds}
                onUserAdded={handleUserAddedOrRemoved}
              />
            </div>
          </CardHeader>
          <CardContent>
            <NetworkList
              refreshTrigger={refreshTrigger}
              onUserRemoved={handleUserAddedOrRemoved}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
