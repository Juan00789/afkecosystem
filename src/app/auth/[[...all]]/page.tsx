// src/app/auth/[[...all]]/page.tsx
'use client';
import { AuthSignIn } from '@/modules/auth/components/auth-signin';

export default function AuthPage() {
  return <AuthSignIn />;
}
