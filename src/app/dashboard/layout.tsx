// src/app/dashboard/layout.tsx
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Role } from '@/modules/auth/types';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    router.push('/auth/sign-in');
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
