// src/modules/auth/components/auth-provider.tsx
'use client';
import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/modules/auth/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserProfile = useCallback(async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      setUserProfile(userDocSnap.data() as UserProfile);
    } else {
      // Create a default profile if it doesn't exist
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
        photoURL: firebaseUser.photoURL || '',
        phoneNumber: firebaseUser.phoneNumber || '',
      };
      await setDoc(userDocRef, newProfile);
      setUserProfile(newProfile);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserProfile(firebaseUser);
        if (pathname.startsWith('/auth')) {
          router.push('/dashboard');
        }
      } else {
        setUser(null);
        setUserProfile(null);
        if (pathname.startsWith('/dashboard')) {
          router.push('/auth/sign-in');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname, fetchUserProfile]);

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle routing
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = { user, userProfile, loading, signOutUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
