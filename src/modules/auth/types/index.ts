// src/modules/auth/types/index.ts

export enum Role {
  Client = 'client',
  Provider = 'provider',
  Admin = 'admin',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  companyName?: string;
  website?: string;
  credits?: number;
  role?: 'admin' | 'user';
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
  };
  isMentor?: boolean;
  mentorBio?: string;
  mentorSpecialties?: string[];
}
