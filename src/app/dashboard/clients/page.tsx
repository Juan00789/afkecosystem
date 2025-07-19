
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// This page is deprecated and is being replaced by /dashboard/network
// This component now just redirects.
export default function DeprecatedClientsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/network');
  }, [router]);

  return (
    <main className="flex-1 flex items-center justify-center p-4 md:p-8 pt-6">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Redirigiendo a la nueva página de Red...</p>
      </div>
    </main>
  );
}
