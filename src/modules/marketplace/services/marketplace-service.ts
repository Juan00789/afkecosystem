// src/modules/marketplace/services/marketplace-service.ts
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/modules/auth/types';
import type { Service } from '../types';

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
    
    // Batch fetch providers
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', providerIds)));
    const providersMap = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as UserProfile]));

    const enrichedServices = servicesData.map(service => ({
      ...service,
      provider: providersMap.get(service.providerId),
    }));

    return enrichedServices;

  } catch (error) {
    console.error("Error fetching marketplace services:", error);
    // In a real app, you might want to throw the error or handle it differently
    return [];
  }
}
