// src/app/layout.tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/modules/auth/components/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'AFKEcosystem',
  description: 'A collaborative ecosystem for clients and providers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          poppins.variable
        )}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
