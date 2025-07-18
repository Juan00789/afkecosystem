
'use client';
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
import { FileUp, MessageSquare, Paperclip } from "lucide-react"
import Image from "next/image"

// Mock data, this would come from Firestore based on params.caseId
const caseData = {
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
    comments: [
        { 
            user: "Tú", 
            avatarFallback: "T",
            text: "Se recibió el abono de $2,500.00. Iniciando con la actualización de perfiles y creación de contenido.",
            time: "hace 2 horas",
        },
        { 
            user: "Sistema",
            avatarFallback: "S",
            text: "Caso creado: Actualización de Redes Sociales para LedPod.",
            time: "hace 1 día",
        }
    ]
};


export default function CaseDetailsPage({ params }: { params: { caseId: string } }) {
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
                    {caseData.comments.map((comment, index) => (
                        <div key={index} className="flex items-start gap-4">
                             <Avatar>
                                <AvatarFallback>{comment.avatarFallback}</AvatarFallback>
                            </Avatar>
                            <div className="w-full">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{comment.user}</p>
                                    <p className="text-xs text-muted-foreground">{comment.time}</p>
                                </div>
                                <div className="p-3 bg-secondary rounded-md mt-1">
                                    <p className="text-sm">{comment.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <div className="w-full flex items-start gap-4">
                         <Avatar>
                            <AvatarFallback>T</AvatarFallback>
                        </Avatar>
                        <div className="w-full space-y-2">
                            <Textarea placeholder="Escribe un nuevo comentario o actualización..." />
                            <div className="flex justify-between items-center">
                                <Button variant="outline" size="sm"><Paperclip className="mr-2 h-4 w-4" /> Adjuntar</Button>
                                <Button><MessageSquare className="mr-2 h-4 w-4" /> Comentar</Button>
                            </div>
                        </div>
                    </div>
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
