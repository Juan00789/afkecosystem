
      
// src/modules/cases/types/index.ts
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  companyName?: string;
  website?: string;
  credits?: number;
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
  };
  network?: {
    clients?: string[];
    providers?: string[];
  };
}


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

export interface Investment {
  id: string;
  investorId: string;
  amount: number;
  createdAt: Timestamp;
}
      
    