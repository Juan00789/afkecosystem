// src/modules/auth/hooks/use-auth.ts
import { useContext } from 'react';
import { AuthContext } from '../components/auth-provider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
