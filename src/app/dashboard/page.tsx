// src/app/dashboard/page.tsx
'use client';

import { Suspense } from 'react';
import { DashboardOverview } from '@/modules/dashboard/components/dashboard-overview';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardOverview userId={user.uid} />
    </Suspense>
  );
}
