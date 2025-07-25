// src/modules/cases/components/case-card.tsx
'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Case } from '../types';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/modules/auth/hooks/use-auth';

interface CaseCardProps {
  caseData: Case;
  // Let the component know from which perspective we are viewing the case
  // This helps determine who the "other party" is.
  // If not provided, it defaults based on the current user's role in the case.
  perspective: 'client' | 'provider';
}

export function CaseCard({ caseData, perspective }: CaseCardProps) {
  const { user } = useAuth();
  
  const otherParty = perspective === 'client' ? caseData.provider : caseData.client;
  const otherPartyRole = perspective === 'client' ? 'Proveedor' : 'Cliente';
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{caseData.title}</CardTitle>
            <CardDescription>
              {otherPartyRole}: {otherParty?.displayName || otherParty?.email || 'N/A'}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(caseData.status)}>
            {caseData.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {caseData.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={otherParty?.photoURL} alt={otherParty?.displayName} />
            <AvatarFallback>{otherParty?.displayName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
           <p className="text-xs text-muted-foreground">
              Last updated {formatDistanceToNow(caseData.lastUpdate.toDate(), { addSuffix: true })}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/cases/${caseData.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
