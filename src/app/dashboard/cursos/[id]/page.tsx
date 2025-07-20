// src/app/dashboard/cursos/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

interface CourseStep {
  title: string;
  content: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  steps: CourseStep[];
}

export default function CursoDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      setLoading(true);
      const docRef = doc(db, 'courses', courseId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
      } else {
        // Handle course not found, maybe redirect
        router.push('/dashboard/cursos');
      }
      setLoading(false);
    };

    fetchCourse();
  }, [courseId, router]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Skeleton className="h-10 w-48 mb-6" />
        <Card>
          <Skeleton className="h-48 w-full rounded-t-lg" />
          <CardContent className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return null; // Or a not found message
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/dashboard/cursos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar a todos los cursos
          </Link>
        </Button>
      </div>

      <Card>
         <CardHeader className="p-0">
             <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                <Image 
                    src={course.coverImageUrl || "https://placehold.co/800x300.png"} 
                    alt={course.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="course business"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        {course.title}
                    </h1>
                    <p className="text-lg text-primary">Microcurso Exprés</p>
                </div>
             </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="mb-6 text-muted-foreground">
            {course.description}
          </p>

          <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
            {course.steps.map((step, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">{index + 1}</span>
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
                    Has completado el curso. ¡A aplicar lo aprendido!
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
