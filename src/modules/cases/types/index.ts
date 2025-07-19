// src/modules/cases/types/index.ts
import type { Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/modules/auth/types';

export interface Case {
  id: string;
  title: string;
  description: string;
  clientId: string;
  providerId: string;
  status: 'new' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  lastUpdate: Timestamp;
  client?: UserProfile | null;
  provider?: UserProfile | null;
}

export interface Comment {
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    authorPhotoURL: string;
    createdAt: Date;
}
