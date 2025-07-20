// src/app/dashboard/cursos/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, Lightbulb, Target, Users, Search, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const courseSteps = [
    {
        icon: <Lightbulb className="h-6 w-6 text-primary" />,
        title: "Paso 1: Define tu Hipótesis",
        content: "Antes de construir, necesitas una idea clara. Tu hipótesis de negocio se compone de tres partes: \n\n1. **Problema:** ¿Qué dolor específico estás resolviendo? Sé muy claro. \n2. **Solución:** ¿Cómo tu producto o servicio alivia ese dolor? \n3. **Cliente:** ¿Para quién es esta solución? Define tu público objetivo inicial."
    },
    {
        icon: <Target className="h-6 w-6 text-primary" />,
        title: "Paso 2: Encuentra a tu Cliente Ideal",
        content: "No puedes hablar con todo el mundo. Crea un 'perfil de cliente ideal' o 'buyer persona'. Piensa en sus datos demográficos, sus hábitos, sus frustraciones y sus metas. ¿Dónde pasan el tiempo online y offline? Ve a esos lugares (foros, grupos de redes sociales, eventos locales) para encontrarlos."
    },
    {
        icon: <Users className="h-6 w-6 text-primary" />,
        title: "Paso 3: Realiza Entrevistas (¡Sin Vender!)",
        content: "El objetivo es aprender, no vender. Habla con al menos 10-15 personas de tu perfil de cliente. Haz preguntas abiertas sobre sus problemas y cómo los resuelven ahora. \n\n- 'Cuéntame sobre la última vez que enfrentaste [el problema]'. \n- '¿Qué fue lo más frustrante de esa experiencia?' \n- '¿Has intentado buscar una solución? ¿Cómo te fue?' \n\nEscucha el 90% del tiempo."
    },
    {
        icon: <Search className="h-6 w-6 text-primary" />,
        title: "Paso 4: Analiza los Resultados",
        content: "Busca patrones en las respuestas. \n\n- ¿Mencionan el problema de la misma manera que tú? \n- ¿Están usando soluciones alternativas? ¿Pagan por ellas? \n- ¿Qué palabras clave usan para describir su frustración? \n\nSi tus hipótesis iniciales no coinciden con lo que escuchas, ¡es una gran noticia! Acabas de evitar construir algo que nadie quiere."
    },
    {
        icon: <DollarSign className="h-6 w-6 text-primary" />,
        title: "Paso 5: La Prueba de Compromiso (El MVP)",
        content: "Una vez que los patrones son claros, es hora de pedir un pequeño compromiso. Esto valida que la gente no solo 'dice' que usaría tu solución, sino que 'haría' algo. Puede ser: \n\n- Un pre-registro en una landing page. \n- Un pequeño pago por un prototipo o una versión beta. \n- Un acuerdo de intención de compra. \n\nEste es tu Producto Mínimo Viable (MVP). Si obtienes compromiso, tienes luz verde para seguir adelante."
    }
];


export default function CursosPage() {
  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar al Dashboard
          </Link>
        </Button>
      </div>

      <Card>
         <CardHeader className="p-0">
             <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                <Image 
                    src="https://placehold.co/800x300.png" 
                    alt="Persona analizando un tablero con notas"
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="strategy planning"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Validación de tu Idea de Negocio
                    </h1>
                    <p className="text-lg text-primary">Microcurso Exprés en 5 Pasos</p>
                </div>
             </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="mb-6 text-muted-foreground">
            El 90% de las startups fracasan. Muchas de ellas por construir algo que nadie quiere. Este microcurso de 10 minutos te enseñará a validar tu idea ANTES de invertir tiempo y dinero, reduciendo drásticamente el riesgo.
          </p>

          <Accordion type="single" collapsible className="w-full">
            {courseSteps.map((step, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex items-center gap-4">
                    {step.icon}
                    <span className="font-semibold">{step.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pl-14 text-base whitespace-pre-wrap">
                  {step.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8 rounded-lg bg-secondary/20 p-6 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-secondary mb-2" />
                <h3 className="text-xl font-bold">¡Felicitaciones!</h3>
                <p className="text-muted-foreground mt-1">
                    Has completado el curso. Ahora tienes un método claro para transformar una simple idea en una oportunidad de negocio validada. ¡A aplicar lo aprendido!
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
