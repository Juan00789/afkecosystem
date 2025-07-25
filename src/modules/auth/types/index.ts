// src/modules/auth/types/index.ts

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  companyName?: string;
  website?: string;
  credits?: number;
  role?: 'admin'; // Role is optional, and only 'admin' is a special value.
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
  };
  isMentor?: boolean;
  mentorBio?: string;
  mentorSpecialties?: string[];
  network?: {
    clients?: string[];
    providers?: string[];
  };
}
