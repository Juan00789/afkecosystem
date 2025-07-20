// src/app/dashboard/marketplace/page.tsx
import { Marketplace } from '@/modules/marketplace/components/marketplace';
import { Suspense } from 'react';

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div>Loading marketplace...</div>}>
      <Marketplace />
    </Suspense>
  );
}
