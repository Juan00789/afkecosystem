// src/app/dashboard/cursos/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/dashboard/cursos/${course.id}`} className="block h-full">
      <Card className="flex flex-col h-full transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl bg-card hover:bg-card/80">
        <CardHeader className="p-0">
          <div className="relative h-40 w-full">
            <Image
              src={course.coverImageUrl || "https://placehold.co/600x400.png"}
              alt={course.title}
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-t-lg"
              data-ai-hint="course business"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <CardTitle className="text-lg leading-tight mb-2">{course.title}</CardTitle>
          <CardDescription className="line-clamp-3 text-sm">{course.description}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 pt-0">
           <span className="text-sm font-semibold text-primary">Ver Curso</span>
        </CardFooter>
      </Card>
    </Link>
  );
}

function CourseSkeleton() {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="p-0">
                <Skeleton className="h-40 w-full rounded-t-lg" />
            </CardHeader>
            <CardContent className="flex-grow p-4">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Skeleton className="h-5 w-20" />
            </CardFooter>
        </Card>
    )
}


export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(coursesList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching courses: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cursos Exprés</h1>
        <p className="text-muted-foreground">Aprende habilidades clave para tu negocio en solo 10 minutos.</p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <CourseSkeleton key={i} />)}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
            ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No hay cursos disponibles</h2>
            <p className="text-muted-foreground mt-2">
                Parece que aún no se han creado cursos. ¡Vuelve pronto o crea uno tú mismo!
            </p>
        </div>
      )}
    </div>
  );
}
