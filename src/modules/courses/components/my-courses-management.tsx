// src/modules/courses/components/my-courses-management.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Edit, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const courseStepSchema = z.object({
  title: z.string().min(3, 'Step title is too short'),
  content: z.string().min(10, 'Step content is too short'),
});

const courseSchema = z.object({
  title: z.string().min(3, 'Course title must be at least 3 characters'),
  description: z.string().min(10, 'Description is too short'),
  coverImageUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  steps: z.array(courseStepSchema).min(1, 'A course must have at least one step'),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface Course extends CourseFormData {
  id: string;
}

export function MyCoursesManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: '', description: '', coverImageUrl: '', steps: [{ title: '', content: '' }] },
  });
  
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "steps"
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'courses'), where('providerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(coursesList);
    });
    return () => unsubscribe();
  }, [user]);

  const handleOpenDialog = (course: Course | null = null) => {
    setEditingCourse(course);
    if (course) {
        reset({
            title: course.title,
            description: course.description,
            coverImageUrl: course.coverImageUrl,
            steps: course.steps
        });
    } else {
      reset({ title: '', description: '', coverImageUrl: '', steps: [{ title: 'Step 1: Introduction', content: '' }] });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: CourseFormData) => {
    if (!user) return;
    setLoading(true);

    try {
      if (editingCourse) {
        const courseRef = doc(db, 'courses', editingCourse.id);
        await updateDoc(courseRef, { ...data, updatedAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Course updated successfully.' });
      } else {
        await addDoc(collection(db, 'courses'), {
          ...data,
          providerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'New course created.' });
      }
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({ title: 'Error', description: 'Failed to save course.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      toast({ title: 'Course Deleted', description: 'The course has been removed.' });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({ title: 'Error', description: 'Failed to delete course.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">Create and manage your micro-courses for the community.</p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Courses Catalog</CardTitle>
                <CardDescription>Add, edit, or remove your courses.</CardDescription>
              </div>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Course
                </Button>
              </DialogTrigger>
            </div>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>{course.steps.length}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(course)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the course "{course.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't created any courses yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Create a New Course'}</DialogTitle>
            <DialogDescription>
              Fill out the details for your course. Add as many steps as you need.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Controller name="title" control={control} render={({ field }) => <Input id="title" {...field} />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Controller name="description" control={control} render={({ field }) => <Textarea id="description" {...field} />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Cover Image URL (Optional)</Label>
              <Controller name="coverImageUrl" control={control} render={({ field }) => <Input id="coverImageUrl" {...field} placeholder="https://placehold.co/800x300.png" />} />
            </div>

            <div className="space-y-4">
                <Label>Course Steps</Label>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2 rounded-lg border p-4 relative">
                    <div className="flex flex-col gap-2 pt-8">
                       <Button type="button" size="icon" variant="outline" onClick={() => move(index, index - 1)} disabled={index === 0}>
                         <ArrowUp className="h-4 w-4" />
                       </Button>
                       <Button type="button" size="icon" variant="outline" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1}>
                         <ArrowDown className="h-4 w-4" />
                       </Button>
                    </div>
                    <div className="flex-grow space-y-2">
                      <Label htmlFor={`steps.${index}.title`}>Step {index + 1} Title</Label>
                      <Controller name={`steps.${index}.title`} control={control} render={({ field }) => <Input {...field} />} />

                      <Label htmlFor={`steps.${index}.content`}>Step {index + 1} Content</Label>
                      <Controller name={`steps.${index}.content`} control={control} render={({ field }) => <Textarea {...field} className="min-h-[100px]" />} />
                    </div>
                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => append({ title: `Step ${fields.length + 1}`, content: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Step
                </Button>
            </div>
            
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Course'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
