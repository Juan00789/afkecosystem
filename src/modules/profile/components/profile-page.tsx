// src/modules/profile/components/profile-page.tsx
'use client';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  phoneNumber: z.string().optional(),
  companyName: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      phoneNumber: '',
      companyName: '',
      website: '',
      bankName: '',
      accountNumber: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      reset({
        displayName: userProfile.displayName || '',
        phoneNumber: userProfile.phoneNumber || '',
        companyName: userProfile.companyName || '',
        website: userProfile.website || '',
        bankName: userProfile.bankInfo?.bankName || '',
        accountNumber: userProfile.bankInfo?.accountNumber || '',
      });
    }
  }, [userProfile, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
        toast({ title: 'Error', description: 'You are not logged in.', variant: 'destructive'});
        return;
    };
    setIsSaving(true);

    try {
        let photoURL = userProfile?.photoURL;

        if (photo) {
            const fileExtension = photo.name.split('.').pop();
            const fileName = `${user.uid}.${fileExtension}`;
            const storageRef = ref(storage, `avatars/${fileName}`);
            const snapshot = await uploadBytes(storageRef, photo);
            photoURL = await getDownloadURL(snapshot.ref);
            await updateProfile(user, { photoURL });
        }
        
        const userDocRef = doc(db, 'users', user.uid);
        const profileData = {
            uid: user.uid,
            email: user.email,
            displayName: data.displayName,
            phoneNumber: data.phoneNumber,
            companyName: data.companyName,
            website: data.website,
            photoURL: photoURL || userProfile?.photoURL || '',
            bankInfo: {
                bankName: data.bankName,
                accountNumber: data.accountNumber,
            }
        };

        await setDoc(userDocRef, profileData, { merge: true });

        toast({ title: 'Success', description: 'Your profile has been updated.' });
        
        // After successful save, reset form to new state to make isDirty false
        reset(data);
        setPhoto(null);
        setPhotoPreview(null);
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (loading && !userProfile) {
    return <div>Loading profile...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and profile information.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
            </TabsList>
            
            <Card className="mt-4">
              <CardContent className="p-6">
                  <TabsContent value="personal" className="space-y-6">
                       <div>
                          <h3 className="text-lg font-medium">Personal Information</h3>
                          <p className="text-sm text-muted-foreground">This is how others will see you on the site.</p>
                      </div>
                      <div className="flex items-center space-x-4">
                          <Avatar className="h-20 w-20">
                              <AvatarImage src={photoPreview || userProfile?.photoURL} alt="User Avatar" />
                              <AvatarFallback>{userProfile?.displayName?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                              <Label htmlFor="photo">Profile Picture</Label>
                              <Input id="photo" type="file" onChange={handlePhotoChange} accept="image/*" />
                              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB.</p>
                          </div>
                      </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="displayName">Full Name</Label>
                              <Controller name="displayName" control={control} render={({ field }) => <Input id="displayName" {...field} />} />
                              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input id="email" type="email" value={userProfile?.email || ''} disabled />
                          </div>
                           <div className="space-y-2">
                              <Label htmlFor="phoneNumber">Phone Number</Label>
                              <Controller name="phoneNumber" control={control} render={({ field }) => <Input id="phoneNumber" {...field} placeholder="+1 (809) 123-4567" />} />
                              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
                          </div>
                      </div>
                  </TabsContent>

                  <TabsContent value="professional" className="space-y-6">
                      <div>
                          <h3 className="text-lg font-medium">Professional Information</h3>
                          <p className="text-sm text-muted-foreground">Showcase your business identity.</p>
                      </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="companyName">Company Name</Label>
                              <Controller name="companyName" control={control} render={({ field }) => <Input id="companyName" {...field} placeholder="Your Company Inc." />} />
                              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
                          </div>
                          <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="website">Website</Label>
                              <Controller name="website" control={control} render={({ field }) => <Input id="website" {...field} placeholder="https://your-website.com" />} />
                              {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
                          </div>
                      </div>
                       <div>
                          <h3 className="text-lg font-medium">Provider ID</h3>
                           <p className="text-sm text-muted-foreground">Share this ID with your clients so they can add you to their network.</p>
                      </div>
                       <div className="flex items-center space-x-2">
                          <Input type="text" value={user?.uid} readOnly />
                          <Button type="button" onClick={() => {
                              navigator.clipboard.writeText(user?.uid || '');
                              toast({ title: 'Copied!', description: 'Provider ID copied to clipboard.' });
                          }}>Copy ID</Button>
                      </div>
                  </TabsContent>

                  <TabsContent value="banking" className="space-y-6">
                      <div>
                          <h3 className="text-lg font-medium">Bank Information</h3>
                          <p className="text-sm text-muted-foreground">Optional. This will be added to the notes of quotes you generate.</p>
                      </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <Label htmlFor="bankName">Bank Name</Label>
                              <Controller name="bankName" control={control} render={({ field }) => <Input id="bankName" {...field} placeholder="e.g., Banco Popular" />} />
                              {errors.bankName && <p className="text-sm text-destructive">{errors.bankName.message}</p>}
                          </div>
                           <div className="space-y-2">
                              <Label htmlFor="accountNumber">Account Number</Label>
                              <Controller name="accountNumber" control={control} render={({ field }) => <Input id="accountNumber" {...field} placeholder="Your account number" />} />
                              {errors.accountNumber && <p className="text-sm text-destructive">{errors.accountNumber.message}</p>}
                          </div>
                      </div>
                  </TabsContent>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSaving || (!isDirty && !photo)}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
        </Tabs>
      </form>
    </div>
  );
}
