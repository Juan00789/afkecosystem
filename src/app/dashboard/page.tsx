// src/app/dashboard/page.tsx
'use client';

import { Suspense } from 'react';
import { DashboardOverview } from '@/modules/dashboard/components/dashboard-overview';
import { useAuth } from '@/modules/auth/hooks/use-auth';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // The redirect logic is now handled by the AuthProvider.
  // If we reach this point, we can be sure the user is authenticated.
  if (!user) {
    return null; // Or a loading spinner, as AuthProvider will redirect.
  }

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardOverview userId={user.uid} />
    </Suspense>
  );
}
