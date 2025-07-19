
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { getFirebaseAuth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider, GithubAuthProvider, OAuthProvider, type AuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.62-4.55 1.62-3.87 0-7.02-3.15-7.02-7.02s3.15-7.02 7.02-7.02c2.21 0 3.66.88 4.51 1.69l2.5-2.5C18.14 2.1 15.47 1 12.48 1 7.01 1 3 5.02 3 10.5S7.01 20 12.48 20c2.94 0 5.22-.98 6.96-2.72 1.79-1.79 2.5-4.25 2.5-6.38 0-.57-.05-.92-.15-1.28H12.48z" />
    </svg>
);

const GithubIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <title>GitHub</title>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
);

const MicrosoftIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <title>Microsoft</title>
        <path d="M11.4 21.9H2.1V12.6h9.3v9.3zm0-11.4H2.1V2.1h9.3v8.4zm10.5 11.4H12.6V12.6h9.3v9.3zm0-11.4H12.6V2.1h9.3v8.4z"/>
    </svg>
)

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleError = (error: any) => {
    setLoading(false);
    console.error("Error de autenticación:", error);
    let title = 'Error de registro';
    let description = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';

    if (error.code) {
        switch (error.code) {
            case 'auth/unauthorized-domain':
                title = 'Dominio no autorizado';
                description = "Este dominio no está autorizado. Ve a la consola de Firebase -> Authentication -> Settings -> Authorized domains y añade 'localhost'.";
                break;
            case 'auth/network-request-failed':
                title = 'Error de Red';
                description = 'No se pudo conectar. Revisa tu conexión a internet y asegúrate de haber creado la base de datos de Firestore en la consola de Firebase.';
                break;
            case 'auth/email-already-in-use':
                title = 'Correo ya registrado';
                description = 'El correo electrónico que ingresaste ya está en uso. Intenta iniciar sesión.';
                break;
            default:
                 description = `Código: ${error.code}. Por favor, inténtalo de nuevo.`;
                 break;
        }
    }
    toast({
        variant: 'destructive',
        title: title,
        description: description,
    });
  }

  const handleSocialLogin = async (provider: AuthProvider) => {
    setLoading(true);
    const auth = getFirebaseAuth();
    await signInWithRedirect(auth, provider).catch(handleError);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: form.name,
        email: form.email,
        phoneNumber: form.phoneNumber,
        createdAt: new Date(),
      });
      
      router.push('/dashboard');

    } catch (error: any)
{
      handleError(error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
       {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        )}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <Logo />
            </div>
            <CardTitle className="text-2xl">Crear una Cuenta</CardTitle>
            <CardDescription>
              Completa tus datos para comenzar a usar la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ej: Ana Torres"
                  required
                  value={form.name}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ana.torres@afk.com"
                  required
                  value={form.email}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número de Teléfono (Opcional)</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="Ej: 829-922-6556"
                  value={form.phoneNumber}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" required value={form.password} onChange={handleInputChange} disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrarse
              </Button>
            </form>

             <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    O continúa con
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => handleSocialLogin(new GoogleAuthProvider())} disabled={loading}>
                    <GoogleIcon />
                </Button>
                <Button variant="outline" onClick={() => handleSocialLogin(new GithubAuthProvider())} disabled={loading}>
                    <GithubIcon />
                </Button>
                <Button variant="outline" onClick={() => handleSocialLogin(new OAuthProvider('microsoft.com'))} disabled={loading}>
                    <MicrosoftIcon />
                </Button>
            </div>


            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="underline">
                Inicia Sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
