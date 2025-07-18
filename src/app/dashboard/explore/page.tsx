
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ExplorePage() {
  const router = useRouter();

  useEffect(() => {
    // This page is deprecated and now redirects to the services page,
    // which handles both provider and client views.
    router.replace('/dashboard/services');
  }, [router]);

  return (
    <main className="flex-1 flex items-center justify-center p-4 md:p-8 pt-6">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Redirigiendo a Servicios...</p>
      </div>
    </main>
  );
}
