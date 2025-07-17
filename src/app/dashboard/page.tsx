import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, ArrowUpRight, CheckCircle, Clock, FileText, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const cases = [
  {
    client: "Ana Torres",
    avatar: "https://placehold.co/100x100.png",
    fallback: "AT",
    service: "Soporte Técnico Urgente",
    status: "En Progreso",
    lastUpdate: "Hace 2 horas",
  },
  {
    client: "Carlos Gomez",
    avatar: "https://placehold.co/100x100.png",
    fallback: "CG",
    service: "Consulta de Facturación",
    status: "Esperando Respuesta",
    lastUpdate: "Hace 1 día",
  },
  {
    client: "Luisa Fernandez",
    avatar: "https://placehold.co/100x100.png",
    fallback: "LF",
    service: "Instalación de Software",
    status: "Completado",
    lastUpdate: "Hace 3 días",
  },
  {
    client: "Javier Rodriguez",
    avatar: "https://placehold.co/100x100.png",
    fallback: "JR",
    service: "Capacitación de Equipo",
    status: "Programado",
    lastUpdate: "Hace 1 semana",
  },
];

const activities = [
    {
        icon: FileText,
        text: "Enviaste una cotización a",
        subject: "Empresa Innova S.A.",
        time: "Hace 5 minutos"
    },
    {
        icon: MessageSquare,
        text: "Nuevo mensaje de",
        subject: "Ana Torres",
        time: "Hace 25 minutos"
    },
    {
        icon: CheckCircle,
        text: "Caso #7234 cerrado:",
        subject: "'Consulta de Facturación'",
        time: "Hace 2 horas"
    },
    {
        icon: Clock,
        text: "Recordatorio de seguimiento para",
        subject: "Carlos Gomez",
        time: "Mañana a las 10:00 AM"
    }
]

export default function DashboardPage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Casos Abiertos</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">+2 esta semana</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">45</div>
                    <p className="text-xs text-muted-foreground">+5 este mes</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Satisfacción del Cliente</CardTitle>
                    <Smile className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">92%</div>
                    <p className="text-xs text-muted-foreground">Basado en 25 respuestas</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolución Primer Contacto</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">78%</div>
                    <p className="text-xs text-muted-foreground">Meta: 80%</p>
                </CardContent>
            </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Casos que requieren tu atención</CardTitle>
                    <CardDescription>
                        Una vista rápida de los casos más recientes y su estado actual.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Servicio</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Última Actualización</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cases.map((c, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={c.avatar} alt={c.client} data-ai-hint="person face" />
                                                <AvatarFallback>{c.fallback}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{c.client}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{c.service}</TableCell>
                                    <TableCell>
                                        <Badge variant={c.status === "Completado" ? "default" : "secondary"} className={
                                            c.status === "Completado" ? "bg-green-500/20 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                                            c.status === "En Progreso" ? "bg-blue-500/20 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                                            "bg-yellow-500/20 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                                        }>
                                            {c.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{c.lastUpdate}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button variant="link">Ver todos los casos <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
                </CardFooter>
            </Card>
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>
                        Un pulso de las últimas interacciones en tu ecosistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="bg-secondary p-2 rounded-full">
                                <activity.icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm">
                                    {activity.text}{' '}
                                    <span className="font-medium text-primary">{activity.subject}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
                 <CardFooter className="justify-end">
                    <Button variant="link">Ver toda la actividad <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
                </CardFooter>
            </Card>
        </div>
    </main>
  );
}

function Briefcase(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

function Smile(props: React.SVGProps<SVGSVGElement>) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
}
