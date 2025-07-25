// src/modules/marketplace/services/marketplace-service.ts
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/modules/auth/types';
import type { Service } from '../types';

// Helper function to fetch documents for a large array of IDs, handling Firestore's 'in' query limit (30 items).
async function fetchProvidersInBatches(providerIds: string[]): Promise<Map<string, UserProfile>> {
    const providersMap = new Map<string, UserProfile>();
    const batches: string[][] = [];

    // Firestore 'in' query supports up to 30 elements.
    for (let i = 0; i < providerIds.length; i += 30) {
        batches.push(providerIds.slice(i, i + 30));
    }

    for (const batch of batches) {
        if (batch.length > 0) {
            const q = query(collection(db, 'users'), where('uid', 'in', batch));
            const usersSnapshot = await getDocs(q);
            usersSnapshot.forEach(doc => {
                providersMap.set(doc.id, doc.data() as UserProfile);
            });
        }
    }
    return providersMap;
}


export async function fetchMarketplaceServices(): Promise<Service[]> {
  try {
    const servicesSnapshot = await getDocs(collection(db, 'services'));
    const servicesData = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];

    if (servicesData.length === 0) {
      return [];
    }

    const providerIds = [...new Set(servicesData.map(s => s.providerId))].filter(Boolean);
    
    if (providerIds.length === 0) {
      return servicesData; // Return services without provider info if no provider IDs
    }
    
    // Fetch providers in batches to avoid query limits
    const providersMap = await fetchProvidersInBatches(providerIds);

    const enrichedServices = servicesData.map(service => ({
      ...service,
      provider: providersMap.get(service.providerId),
    }));

    return enrichedServices;

  } catch (error) {
    console.error("Error fetching marketplace services:", error);
    return [];
  }
}
