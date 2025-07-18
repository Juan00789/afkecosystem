
'use client';
import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FileUp, MessageSquare, Paperclip, Loader2, Send } from "lucide-react"
import Image from "next/image"
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, getDoc, DocumentData } from "firebase/firestore";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const WhatsAppIcon = () => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current">
        <title>WhatsApp</title>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.204-1.634a11.86 11.86 0 005.785 1.47h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);


interface Comment {
    id: string;
    text: string;
    userId: string;
    userName: string;
    userFallback: string;
    createdAt: Timestamp;
}

interface CaseData {
    id: string;
    clientName: string;
    providerName: string;
    services: { name: string, price: string }[];
    status: string;
    financials?: {
        total: string;
        paid: string;
        due: string;
    };
    images?: { id: number; src: string; hint: string }[];
}


export default function CaseDetailsPage({ params }: { params: { caseId: string } }) {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState({ name: 'Tú', fallback: 'T', activeRole: 'provider' });
    const [caseData, setCaseData] = useState<CaseData | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData({
                        name: data.name || 'Usuario',
                        fallback: (data.name || 'U').charAt(0).toUpperCase(),
                        activeRole: data.activeRole || 'provider'
                    });
                }
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!params.caseId) return;

        setLoading(true);
        // Fetch case data
        const caseDocRef = doc(db, 'cases', params.caseId);
        const unsubscribeCase = onSnapshot(caseDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setCaseData({ id: docSnap.id, ...docSnap.data() } as CaseData);
            } else {
                toast({ variant: 'destructive', title: 'Caso no encontrado' });
            }
        });

        // Fetch comments
        const commentsQuery = query(collection(db, 'cases', params.caseId, 'comments'), orderBy('createdAt', 'asc'));
        const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(commentsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching comments: ", error);
            toast({
                variant: 'destructive',
                title: 'Error al cargar comentarios',
                description: 'No se pudieron obtener los datos.'
            });
            setLoading(false);
        });

        return () => {
            unsubscribeCase();
            unsubscribeComments();
        };
    }, [params.caseId, toast]);

    const handleCommentSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim() || !caseData) return;

        setSaving(true);
        try {
            await addDoc(collection(db, 'cases', params.caseId, 'comments'), {
                text: newComment,
                userId: user.uid,
                userName: userData.name,
                userFallback: userData.fallback,
                createdAt: Timestamp.now(),
            });
            setNewComment("");
        } catch (error) {
            console.error('Error al añadir comentario:', error);
            toast({
                variant: 'destructive',
                title: 'Error al comentar',
                description: 'No se pudo enviar tu comentario. Inténtalo de nuevo.',
            });
        } finally {
            setSaving(false);
        }
    };
    
    if (loading || !caseData) {
        return (
            <main className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </main>
        )
    }

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-4">
            {/* Comments/Timeline Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Línea de Tiempo del Caso</CardTitle>
                    <CardDescription>Historial de actividad y comunicaciones.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!comments.length && (
                         <div className="text-center text-muted-foreground py-8">
                            <p>No hay comentarios todavía.</p>
                            <p>¡Sé el primero en añadir una actualización!</p>
                        </div>
                    )}
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-4">
                             <Avatar>
                                <AvatarFallback>{comment.userFallback}</AvatarFallback>
                            </Avatar>
                            <div className="w-full">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{comment.userName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: es }) : 'hace un momento'}
                                    </p>
                                </div>
                                <div className="p-3 bg-secondary rounded-md mt-1">
                                    <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                   <form onSubmit={handleCommentSubmit} className="w-full flex items-start gap-4">
                         <Avatar>
                             <AvatarFallback>{userData.fallback}</AvatarFallback>
                        </Avatar>
                        <div className="w-full space-y-2">
                             <Textarea 
                                placeholder={
                                    userData.activeRole === 'client' 
                                    ? "Enviar mensaje como desde WhatsApp..." 
                                    : "Escribe un nuevo comentario o actualización..."
                                }
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={saving}
                            />
                            <div className="flex justify-between items-center">
                               {userData.activeRole === 'provider' ? (
                                    <Button variant="outline" size="sm" type="button" disabled={saving}>
                                        <Paperclip className="mr-2 h-4 w-4" /> Adjuntar
                                    </Button>
                               ) : ( <div/> ) }
                                <Button type="submit" disabled={saving || !newComment.trim()} className={userData.activeRole === 'client' ? 'bg-[#25D366] hover:bg-[#1DAE5A] text-white' : ''}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {userData.activeRole === 'client' ? (
                                       <> <WhatsAppIcon /> <span className="ml-2">Enviar</span></>
                                    ) : (
                                       <> <MessageSquare className="mr-2 h-4 w-4" /> Comentar </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardFooter>
            </Card>

             {/* Image Gallery Card */}
             <Card>
                <CardHeader>
                    <CardTitle>Galería de Archivos</CardTitle>
                    <CardDescription>Imágenes y documentos relevantes del caso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {caseData.images?.map(image => (
                            <div key={image.id} className="relative aspect-video rounded-md overflow-hidden group">
                                <Image src={image.src} alt={`Imagen ${image.id}`} layout="fill" objectFit="cover" data-ai-hint={image.hint}/>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white font-semibold">Ver Imagen</p>
                                </div>
                            </div>
                        ))}
                         <div className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                            <FileUp className="h-8 w-8 text-muted-foreground mb-2"/>
                            <p className="text-sm text-muted-foreground">Subir Archivo</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Details Column */}
        <div className="md:col-span-1 space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <Avatar className="h-12 w-12">
                        {/* <AvatarImage src={caseData.client.avatar} data-ai-hint="company logo" /> */}
                        <AvatarFallback>{caseData.clientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{caseData.clientName}</CardTitle>
                        <CardDescription>
                            {caseData.services.map(s => s.name).join(', ')}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                     <Badge>{caseData.status}</Badge>
                </CardContent>
                <Separator />
                <CardContent className="pt-6">
                   <CardTitle className="text-lg mb-2">Detalles Financieros</CardTitle>
                   <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                           <span className="text-muted-foreground">Monto Total:</span>
                           <span className="font-medium">{caseData.financials?.total || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between">
                           <span className="text-muted-foreground">Abonado:</span>
                           <span className="font-medium text-primary">{caseData.financials?.paid || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between">
                           <span className="text-muted-foreground">Pendiente:</span>
                           <span className="font-medium">{caseData.financials?.due || 'N/A'}</span>
                       </div>
                   </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" variant="outline">Generar Factura</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </main>
  );
}
