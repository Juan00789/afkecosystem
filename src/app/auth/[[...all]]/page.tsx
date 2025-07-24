// src/app/auth/[[...all]]/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { app } from '@/lib/firebase-config';
import { useToast } from '@/hooks/use-toast';
import { Briefcase } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// SVG for the cracked glass effect
const CrackedGlassSVG = () => (
  <svg
    className="absolute inset-0 h-full w-full opacity-20"
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="cracks"
        patternUnits="userSpaceOnUse"
        width="100"
        height="100"
        patternTransform="scale(2) rotate(35)"
      >
        <path
          d="M0 50 H100 M50 0 V100"
          stroke="hsl(var(--foreground))"
          strokeWidth="0.5"
          opacity="0.5"
        />
        <path
          d="M25 25 L75 75 M25 75 L75 25"
          stroke="hsl(var(--foreground))"
          strokeWidth="0.2"
          opacity="0.3"
        />
        <path
          d="M10 0 L0 10 M90 0 L100 10 M0 90 L10 100 M100 90 L90 100"
          stroke="hsl(var(--foreground))"
          strokeWidth="0.3"
          opacity="0.4"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#cracks)" />
  </svg>
);


export default function AuthPage() {
  const auth = getAuth(app);
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHoveringWolf, setIsHoveringWolf] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { clientX, clientY } = e;
    const { offsetWidth, offsetHeight } = containerRef.current;
    const x = (clientX / offsetWidth - 0.5) * 2; // -1 to 1
    const y = (clientY / offsetHeight - 0.5) * 2; // -1 to 1

    const wolfElement = containerRef.current.querySelector('#wolf-image') as HTMLElement;
    if (wolfElement) {
        wolfElement.style.transform = `translate(${x * 10}px, ${y * 10}px) scale(1.05)`;
    }
  };


  const handleAuthAction = async (action: 'login' | 'register' | 'recover' | 'google' | 'github') => {
    setLoading(true);
    try {
      switch (action) {
        case 'login':
          if (!email || !password) throw new Error('Email and password are required.');
          await signInWithEmailAndPassword(auth, email, password);
          toast({ title: 'Success!', description: 'Welcome back!' });
          break;
        case 'register':
          if (!email || !password) throw new Error('Email and password are required.');
          await createUserWithEmailAndPassword(auth, email, password);
          toast({ title: 'Account Created!', description: 'Welcome to AFKEcosystem.' });
          break;
        case 'recover':
          if (!email) throw new Error('Email is required to send a recovery link.');
          await sendPasswordResetEmail(auth, email);
          toast({ title: 'Email Sent', description: 'Check your inbox for a password reset link.' });
          break;
        case 'google':
            await signInWithPopup(auth, new GoogleAuthProvider());
            toast({ title: 'Success!', description: 'Signed in with Google.' });
            break;
        case 'github':
            await signInWithPopup(auth, new GithubAuthProvider());
            toast({ title: 'Success!', description: 'Signed in with GitHub.' });
            break;
      }
    } catch (error: any) {
        const errorMessage = error.message.replace('Firebase: ', '').replace(/ \(auth\/.*\)\./, '.');
        toast({
            title: 'Authentication Error',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden"
        style={{ perspective: '1000px' }}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-background via-black to-background opacity-80" />
        <CrackedGlassSVG />
        
        <div 
            id="wolf-image"
            className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
            onMouseEnter={() => setIsHoveringWolf(true)}
            onMouseLeave={() => setIsHoveringWolf(false)}
        >
            <Image 
                src="https://placehold.co/800x800.png"
                alt="Spirit Animal"
                width={600}
                height={600}
                className={cn(
                    "transition-all duration-500 ease-in-out opacity-20 dark:opacity-10",
                    isHoveringWolf ? "scale-110 opacity-30 dark:opacity-20" : ""
                )}
                style={{ filter: 'drop-shadow(0 0 30px hsl(var(--primary) / 0.5))' }}
                data-ai-hint="shadow wolf"
            />
        </div>

      <Card className="w-full max-w-sm text-center bg-black/30 backdrop-blur-sm border-primary/20 shadow-2xl shadow-primary/10 z-10">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-black/50">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-primary font-bold">AFKEcosystem</CardTitle>
          <CardDescription className="text-muted-foreground">
            Libera tu potencial. Ingresa a tu espacio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-black/40 border-primary/30 focus:border-primary focus:ring-primary"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                 className="bg-black/40 border-primary/30 focus:border-primary focus:ring-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleAuthAction('login')} disabled={loading}>
                  {loading ? 'Accediendo...' : 'Iniciar Sesión'}
                </Button>
                <Button variant="secondary" onClick={() => handleAuthAction('register')} disabled={loading}>
                  {loading ? 'Creando...' : 'Registrarse'}
                </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
              </div>
            </div>

             <div className="grid grid-cols-2 gap-4">
               <Button variant="outline" className="bg-black/40 border-primary/30" onClick={() => handleAuthAction('google')} disabled={loading}>
                  <svg className="mr-2 h-4 w-4" role="img" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.3v2.84C4.02 20.94 7.7 23 12 23z"></path><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.3C1.42 8.84 1 10.4 1 12s.42 3.16 1.2 4.93l3.54-2.84z"></path><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4.02 3.06 2.3 5.93l3.54 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>
                  Google
                </Button>
                <Button variant="outline" className="bg-black/40 border-primary/30" onClick={() => handleAuthAction('github')} disabled={loading}>
                  <svg className="mr-2 h-4 w-4" role="img" viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.803 24 17.302 24 12c0-6.627-5.373-12-12-12z"></path></svg>
                  GitHub
                </Button>
            </div>

            <div className="text-sm text-center">
                <Button variant="link" size="sm" onClick={() => handleAuthAction('recover')} disabled={loading}>
                    ¿Olvidaste tu contraseña?
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
