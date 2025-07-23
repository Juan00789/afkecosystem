// src/app/dashboard/mentorias/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/modules/auth/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BrainCircuit, LayoutGrid, Megaphone, Code, TrendingUp, Landmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const MENTOR_CATEGORIES = [
    { name: 'Todos', icon: <LayoutGrid className="h-4 w-4 mr-2" /> },
    { name: 'Marketing', icon: <Megaphone className="h-4 w-4 mr-2" /> },
    { name: 'Finanzas', icon: <Landmark className="h-4 w-4 mr-2" /> },
    { name: 'Tecnología', icon: <Code className="h-4 w-4 mr-2" /> },
    { name: 'Estrategia', icon: <TrendingUp className="h-4 w-4 mr-2" /> },
];


const MentorCard = ({ mentor }: { mentor: UserProfile }) => {
    return (
        <Card className="flex flex-col transition-shadow duration-300 hover:shadow-lg">
            <CardHeader className="text-center items-center">
                <Link href={`/profile/${mentor.uid}`}>
                    <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
                        <AvatarImage src={mentor.photoURL} alt={mentor.displayName} />
                        <AvatarFallback className="text-3xl">{mentor.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                </Link>
                <CardTitle className="text-xl">{mentor.displayName}</CardTitle>
                <CardDescription>{mentor.companyName || 'Emprendedor Independiente'}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-3 min-h-[60px]">
                    {mentor.mentorBio || 'Mentor dedicado a potenciar el crecimiento de emprendedores.'}
                </p>
                {mentor.mentorSpecialties && mentor.mentorSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {mentor.mentorSpecialties.slice(0, 3).map(specialty => (
                            <Badge key={specialty} variant="secondary">{specialty}</Badge>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={`/profile/${mentor.uid}`}>Ver Perfil y Agendar</Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

const MentorSkeleton = () => (
    <Card>
        <CardHeader className="text-center items-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);

export default function MentoriasPage() {
    const [mentors, setMentors] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    useEffect(() => {
        const fetchMentors = async () => {
            setLoading(true);
            try {
                const mentorsQuery = query(collection(db, 'users'), where('isMentor', '==', true));
                const snapshot = await getDocs(mentorsQuery);
                const mentorsList = snapshot.docs.map(doc => doc.data() as UserProfile);
                setMentors(mentorsList);
            } catch (error) {
                console.error("Error fetching mentors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMentors();
    }, []);

    const filteredMentors = useMemo(() => {
        return mentors.filter(mentor => {
            const searchTermLower = searchTerm.toLowerCase();
            const specialtiesLower = mentor.mentorSpecialties?.map(s => s.toLowerCase()) || [];

            const matchesCategory = selectedCategory === 'Todos' || specialtiesLower.includes(selectedCategory.toLowerCase());
            
            const matchesSearch = searchTermLower === '' || 
                                  mentor.displayName?.toLowerCase().includes(searchTermLower) ||
                                  specialtiesLower.some(s => s.includes(searchTermLower));

            return matchesCategory && matchesSearch;
        });
    }, [mentors, searchTerm, selectedCategory]);


  return (
    <div className="space-y-6">
       <header>
            <div className="flex items-center gap-4 mb-2">
                <BrainCircuit className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Mentorías</h1>
                    <p className="text-muted-foreground">Invierte en conocimiento. Conecta con expertos que te ayudarán a crecer.</p>
                </div>
            </div>
      </header>
       <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Buscar mentor por nombre o especialidad (ej: 'Marketing')"
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {MENTOR_CATEGORIES.map(category => (
                    <Button 
                        key={category.name}
                        variant={selectedCategory === category.name ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category.name)}
                        className="flex items-center"
                    >
                        {category.icon}
                        {category.name}
                    </Button>
                ))}
            </div>
      </div>

       {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <MentorSkeleton key={i} />)}
        </div>
      ) : filteredMentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map(mentor => (
            <MentorCard key={mentor.uid} mentor={mentor} />
          ))}
        </div>
      ) : (
         <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No se encontraron mentores</h2>
            <p className="text-muted-foreground mt-2">Prueba con otra búsqueda o anímate a ser el primero en ofrecer mentoría.</p>
        </div>
      )}

    </div>
  );
}
