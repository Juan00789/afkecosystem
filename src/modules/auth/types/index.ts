// src/modules/auth/types/index.ts

export enum Role {
  Client = 'client',
  Provider = 'provider',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  companyName?: string;
  website?: string;
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
  };
}
