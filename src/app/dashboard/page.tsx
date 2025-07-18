
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
import { MoreHorizontal, ArrowUpRight, CheckCircle, Clock, FileText, MessageSquare, Briefcase, Users, Smile, UserCheck, Activity } from "lucide-react";

const cases: any[] = [];
const activities: any[] = [];

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Casos Activos</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">No tienes casos en progreso.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tus Clientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">Añade tu primer cliente para empezar.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tu Próxima Tarea</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold">¡Todo en orden!</div>
                    <p className="text-xs text-muted-foreground">No hay acciones urgentes por ahora.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pulso del Ecosistema</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Tranquilo</div>
                    <p className="text-xs text-muted-foreground">El sistema está listo para la acción.</p>
                </CardContent>
            </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Casos que requieren tu atención</CardTitle>
                    <CardDescription>
                        Aquí te mostraré los casos que necesitan una acción de tu parte.
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
                            {cases.length > 0 ? (
                              cases.map((c, i) => (
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
                                        <Badge variant={c.status === "Completado" ? "default" : "secondary"}>
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
                              ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No hay casos que requieran tu atención. ¡Buen trabajo!
                                    </TableCell>
                                </TableRow>
                            )}
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
                        Te mantendré al tanto de las últimas interacciones en tu ecosistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activities.length > 0 ? (
                        activities.map((activity, index) => (
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
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md">
                            <p className="text-muted-foreground">Todo tranquilo. La actividad aparecerá aquí.</p>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="justify-end">
                    <Button variant="link">Ver toda la actividad <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
