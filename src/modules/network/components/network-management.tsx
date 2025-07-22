// src/modules/network/components/network-management.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AddUserDialog } from './add-user-dialog';
import { NetworkList } from './network-list';
import { Separator } from '@/components/ui/separator';
import { Users, Briefcase } from 'lucide-react';

export function NetworkManagement() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserAddedOrRemoved = () => {
    setRefreshTrigger(prev => prev + 1);
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
              <AddUserDialog roleToAdd="client" onUserAdded={handleUserAddedOrRemoved} />
            </div>
          </CardHeader>
          <CardContent>
            <NetworkList roleToList="client" refreshTrigger={refreshTrigger} onUserRemoved={handleUserAddedOrRemoved} />
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
              <AddUserDialog roleToAdd="provider" onUserAdded={handleUserAddedOrRemoved} />
            </div>
          </CardHeader>
          <CardContent>
            <NetworkList roleToList="provider" refreshTrigger={refreshTrigger} onUserRemoved={handleUserAddedOrRemoved} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
