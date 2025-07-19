// src/app/dashboard/cases/[id]/page.tsx
import { CaseDetail } from '@/modules/cases/components/case-detail';
import { Suspense } from 'react';

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading case details...</div>}>
      <CaseDetail caseId={params.id} />
    </Suspense>
  );
}
