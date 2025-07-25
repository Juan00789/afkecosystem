// src/modules/marketplace/types/index.ts
import type { UserProfile } from '@/modules/auth/types';

export interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    providerId: string;
    category?: string;
    provider?: UserProfile;
}
