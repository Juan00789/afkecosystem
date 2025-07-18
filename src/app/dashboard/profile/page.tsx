
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, type User, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    photoURL: '',
    userId: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          const userData = docSnap.exists() ? docSnap.data() : {};
          
          setForm({
            name: userData.name || currentUser.displayName || '',
            email: currentUser.email || '',
            phoneNumber: userData.phoneNumber || '',
            photoURL: userData.photoURL || currentUser.photoURL || '',
            userId: currentUser.uid,
          });

        } catch (error) {
           console.error("Error fetching user data:", error);
           toast({
             variant: 'destructive',
             title: 'Error de conexión',
             description: 'No se pudo cargar tu perfil. Revisa tu conexión.',
           });
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL });
      
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }

      setForm(prev => ({ ...prev, photoURL }));
      toast({
        title: 'Foto de perfil actualizada',
        description: 'Tu nueva foto se ha guardado.',
      });
    } catch (error) {
      console.error('Error al subir la foto:', error);
      toast({
        variant: 'destructive',
        title: 'Error al subir la imagen',
        description: 'No se pudo guardar tu nueva foto. Inténtalo de nuevo.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { 
        name: form.name,
        phoneNumber: form.phoneNumber,
      }, { merge: true });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: form.name });
      }

      toast({
        title: 'Perfil actualizado',
        description: 'Tu información ha sido guardada correctamente.',
      });
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo actualizar tu perfil. Inténtalo de nuevo.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = () => {
    if (!form.userId) return;
    navigator.clipboard.writeText(form.userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
        title: 'ID de Usuario Copiado',
        description: 'Tu ID ha sido copiado al portapapeles.',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fallback = form.name ? form.name.charAt(0).toUpperCase() : 'U';

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Tu Perfil</CardTitle>
          <CardDescription>
            Aquí puedes ver y actualizar tu información personal y foto de perfil.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-32 w-32 cursor-pointer" onClick={handleAvatarClick}>
                  <AvatarImage src={form.photoURL} alt={form.name} />
                  <AvatarFallback className="text-4xl">{fallback}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" onClick={handleAvatarClick}>
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  ) : (
                    <Camera className="h-8 w-8 text-white" />
                  )}
                </div>
                <Input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/png, image/jpeg, image/gif"
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="userId">Tu ID de Usuario (para compartir)</Label>
                <div className="flex gap-2">
                    <Input id="userId" value={form.userId} readOnly />
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyId} disabled={copied}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Este es tu ID. Compártelo con tus clientes para que puedan conectarse contigo, o con otros proveedores para añadirlos a tu red.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        disabled={saving || uploading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        disabled
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Número de Teléfono (Opcional)</Label>
                    <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={form.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Ej: 829-922-6556"
                        disabled={saving || uploading}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="manage-connections">Gestionar Conexiones</Label>
                     <Button asChild variant="outline" className="w-full justify-start font-normal">
                        <Link href="/dashboard/network">
                            Ir a tu Red
                        </Link>
                     </Button>
                     <p className="text-xs text-muted-foreground">Añade y gestiona tus clientes y proveedores en la sección de Red.</p>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={saving || uploading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </Card