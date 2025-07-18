
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
import { FileUp, MessageSquare, Paperclip, Loader2 } from "lucide-react"
import Image from "next/image"
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
    client: {
        name: string;
        avatar: string;
        fallback: string;
    };
    service: string;
    status: string;
    financials: {
        total: string;
        paid: string;
        due: string;
    };
    images: { id: number; src: string; hint: string }[];
}

// Mock data, this would come from Firestore based on params.caseId
const caseData: CaseData = {
    id: "case-001",
    client: {
        name: "Miguel de LedPod",
        avatar: "https://placehold.co/100x100.png",
        fallback: "ML",
    },
    service: "Actualización de Redes Sociales",
    status: "En Progreso",
    financials: {
        total: "5,000.00",
        paid: "2,500.00",
        due: "2,500.00",
    },
    images: [
        { id: 1, src: "https://placehold.co/600x400.png", hint: "social media" },
        { id: 2, src: "https://placehold.co/600x400.png", hint: "website mockup" },
        { id: 3, src: "https://placehold.co/600x400.png", hint: "analytics report" },
    ],
};

export default function CaseDetailsPage({ params }: { params: { caseId: string } }) {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState({ name: 'Tú', fallback: 'T'});
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
                        fallback: (data.name || 'U').charAt(0).toUpperCase()
                    });
                }
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        setLoading(true);
        const commentsQuery = query(collection(db, 'cases', params.caseId, 'comments'), orderBy('createdAt', 'asc'));
        
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
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

        return () => unsubscribe();
    }, [params.caseId, toast]);

    const handleCommentSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        setSaving(true);
        try {
            await addDoc(collection(db, 'cases', params.caseId, 'comments'), {
                text: newComment,
                userId: user.uid,
                userName: userData.name,
                userFallback: userData.fallback,
                createdAt: new Date(),
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


  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-4">
            {/* Comments/Timeline Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Línea de Tiempo del Caso</CardTitle>
                    <CardDescription>Historial de actividad y comentarios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading && (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {!loading && comments.length === 0 && (
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
                                        {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: es })}
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
                                placeholder="Escribe un nuevo comentario o actualización..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={saving}
                            />
                            <div className="flex justify-between items-center">
                                <Button variant="outline" size="sm" type="button" disabled={saving}><Paperclip className="mr-2 h-4 w-4" /> Adjuntar</Button>
                                <Button type="submit" disabled={saving || !newComment.trim()}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <MessageSquare className="mr-2 h-4 w-4" /> Comentar
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
                        {caseData.images.map(image => (
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
                        <AvatarImage src={caseData.client.avatar} data-ai-hint="company logo" />
                        <AvatarFallback>{caseData.client.fallback}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{caseData.client.name}</CardTitle>
                        <CardDescription>{caseData.service}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                     <Badge>En Progreso</Badge>
                </CardContent>
                <Separator />
                <CardContent className="pt-6">
                   <CardTitle className="text-lg mb-2">Detalles Financieros</CardTitle>
                   <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                           <span className="text-muted-foreground">Monto Total:</span>
                           <span className="font-medium">${caseData.financials.total}</span>
                       </div>
                       <div className="flex justify-between">
                           <span className="text-muted-foreground">Abonado:</span>
                           <span className="font-medium text-primary">${caseData.financials.paid}</span>
                       </div>
                       <div className="flex justify-between">
                           <span className="text-muted-foreground">Pendiente:</span>
                           <span className="font-medium">${caseData.financials.due}</span>
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
